import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";

test("contribution review: optional alt, transactional facets, ownership, admin edits, outbox and grants", async () => {
  const db = new PGlite();
  const owner = "11111111-1111-4111-8111-111111111111",
    other = "22222222-2222-4222-8222-222222222222",
    admin = "33333333-3333-4333-8333-333333333333",
    work = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    guest = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  async function as(role: string, sub = "", fresh = false) {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claims',$1,false)", [
      JSON.stringify({
        role,
        sub,
        aal: fresh ? "aal2" : "aal1",
        amr: fresh ? [{ method: "totp", timestamp: Date.now() / 1000 }] : [],
      }),
    ]);
    await db.exec(`set role ${role}`);
  }
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth;
      create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,last_sign_in_at timestamptz);
      create table auth.mfa_factors(id uuid primary key default gen_random_uuid(),user_id uuid,factor_type text,status text);
      create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
      create function auth.uid() returns uuid language sql stable as $$select nullif(auth.jwt()->>'sub','')::uuid$$;
      grant usage on schema public,auth to anon,authenticated,service_role; grant execute on function auth.uid(),auth.jwt() to anon,authenticated,service_role;`);
    for (const file of fs
      .readdirSync("supabase/migrations")
      .filter((f) => f.endsWith(".sql"))
      .sort())
      await db.exec(fs.readFileSync(`supabase/migrations/${file}`, "utf8"));
    await db.exec(`insert into auth.users values('${owner}','owner@example.invalid',now(),now()),('${other}','other@example.invalid',null,null),('${admin}','admin@example.invalid',now(),now());
      insert into public.roles values('${admin}','admin');
      insert into public.categories values('workers','Workers'),('farmers','Farmers'),('anti-war','Anti-War');
      insert into public.formats values('poster-placard','Poster/Placard');
      insert into public.licences values('CC0-1.0','https://creativecommons.org/publicdomain/zero/1.0/',true,true,false);`);
    await as("service_role");
    await db.exec(
      `insert into public.works(id,owner_id,slug,title,artist_name,alt,source,licence_id,format_slug) values('${work}','${owner}','test-work','Test work','Pseudonym','','https://example.invalid/work','CC0-1.0','poster-placard'),('${guest}',null,'test-guest','Guest work','Pseudonym','','https://example.invalid/work','CC0-1.0','poster-placard');`,
    );
    await db.query(
      "insert into public.work_files(work_id,object_key,kind,mime,bytes) values($1,'test-clean','sanitized','image/png',100)",
      [work],
    );
    await as("authenticated", owner);
    await db.query("select public.save_work_facets($1,$2,$3)", [
      work,
      ["workers", "farmers", "anti-war"],
      [" protest ", "PROTEST", "<b>Local</b>  solidarity"],
    ]);
    assert.equal(
      (await db.query("select * from public.work_categories where work_id=$1", [work])).rows.length,
      3,
    );
    assert.equal(
      (await db.query("select * from public.work_tags where work_id=$1", [work])).rows.length,
      2,
    );
    await as("anon");
    assert.equal(
      (await db.query("select label from public.tags where label='Local solidarity'")).rows.length,
      0,
      "unpublished custom labels are private",
    );
    assert.equal(
      (await db.query("select label from public.tags where label='Protest'")).rows.length,
      1,
      "canonical suggestions remain public",
    );
    await as("authenticated", other);
    assert.equal(
      (await db.query("select label from public.tags where label='Local solidarity'")).rows.length,
      0,
      "another contributor cannot enumerate private tags",
    );
    await as("authenticated", owner);
    await assert.rejects(
      db.query("select public.save_work_facets($1,$2,$3)", [guest, [], []]),
      "NULL owner never bypasses authorization",
    );
    await assert.rejects(db.query("select public.grant_admin('owner@example.invalid')"));
    await assert.rejects(
      db.query("select public.review_work_metadata($1,'Stolen','','poster-placard',$2,$3)", [
        guest,
        [],
        [],
      ]),
    );
    await db.exec(`update public.works set status='pending' where id='${work}'`);
    await assert.rejects(
      db.query("select public.save_work_facets($1,$2,$3)", [work, [], []]),
      "pending owner cannot mutate review",
    );
    await as("authenticated", other);
    assert.equal((await db.query("select * from public.work_notifications")).rows.length, 0);
    await assert.rejects(db.query("select public.save_work_facets($1,$2,$3)", [work, [], []]));
    await as("authenticated", admin);
    await assert.rejects(
      db.query("select public.review_work_metadata($1,'Reviewed','','poster-placard',$2,$3)", [
        work,
        [],
        [],
      ]),
    );
    await as("authenticated", admin, true);
    assert.equal((await db.query("select * from public.work_notifications")).rows.length, 1);
    await db.query(
      "select public.review_work_metadata($1,'Reviewed','A red hand on white paper.','poster-placard',$2,$3)",
      [work, ["workers", "farmers", "anti-fascism"], ["Solidarity", "Renamed custom"]],
    );
    assert.equal(
      (await db.query("select * from public.work_categories where work_id=$1", [work])).rows.length,
      3,
    );
    assert.equal(
      (await db.query("select * from public.work_tags where work_id=$1", [work])).rows.length,
      2,
    );
    await db.exec(
      `update public.works set status='changes_requested',feedback='Please improve this image' where id='${work}'`,
    );
    await as("authenticated", owner);
    await db.exec(`update public.works set status='pending' where id='${work}'`);
    await as("authenticated", admin, true);
    await db.exec(
      `update public.works set status='rejected',feedback='Cannot publish this version' where id='${work}'`,
    );
    assert.equal(
      (await db.query("select * from public.work_notifications")).rows.length,
      4,
      "all transitions atomically enqueue mail",
    );
    assert.equal(
      (
        await db.query<{ feedback: string }>(
          "select feedback from public.work_notifications where event='changes_requested'",
        )
      ).rows[0].feedback,
      "Please improve this image",
      "later rejection cannot overwrite delayed changes-requested feedback",
    );
    assert.ok(
      (await db.query("select * from public.audit_log where action='review_metadata'")).rows.length,
    );
    await as("service_role");
    await assert.rejects(db.query("select public.grant_admin('other@example.invalid')"));
    await db.query("select public.grant_admin('owner@example.invalid')");
    await db.query("select public.grant_admin('owner@example.invalid')");
    assert.equal(
      (await db.query("select * from public.roles where user_id=$1 and role='admin'", [owner])).rows
        .length,
      1,
    );
    await as("anon");
    await assert.rejects(db.query("select * from public.work_notifications"));
    assert.equal(
      (await db.query("select label from public.tags where label='Renamed custom'")).rows.length,
      0,
      "rejected work tags remain private",
    );
    await assert.rejects(db.query("select public.save_work_facets($1,$2,$3)", [guest, [], []]));
    await as("service_role");
    await db.query(
      "insert into public.work_tags(work_id,tag_slug) select $1,slug from public.tags where label='Renamed custom'",
      [guest],
    );
    await db.query(
      "update public.works set status='approved',publication_state='published' where id=$1",
      [guest],
    );
    await as("authenticated", owner);
    await assert.rejects(
      db.query("select public.review_work_metadata($1,'Unauthorized','','poster-placard',$2,$3)", [
        guest,
        ["workers"],
        ["Protest"],
      ]),
      "contributors cannot edit approved metadata",
    );
    await as("authenticated", admin);
    await assert.rejects(
      db.query("select public.review_work_metadata($1,'No MFA','','poster-placard',$2,$3)", [
        guest,
        ["workers"],
        ["Protest"],
      ]),
      "stale admin sessions cannot edit approved metadata",
    );
    await as("authenticated", admin, true);
    await db.query(
      "select public.review_work_metadata($1,'Published edit','A red print on cream paper.','poster-placard',$2,$3)",
      [guest, ["workers"], ["Renamed custom", "Protest"]],
    );
    assert.equal(
      (await db.query<{ title: string }>("select title from public.works where id=$1", [guest]))
        .rows[0].title,
      "Published edit",
    );
    assert.deepEqual(
      (
        await db.query<{ category_slug: string }>(
          "select category_slug from public.work_categories where work_id=$1",
          [guest],
        )
      ).rows.map((row) => row.category_slug),
      ["workers"],
    );
    assert.equal(
      (
        await db.query(
          "select * from public.audit_log where action='review_metadata' and target_id=$1",
          [guest],
        )
      ).rows.length,
      1,
    );
    await as("anon");
    assert.equal(
      (await db.query("select label from public.tags where label='Renamed custom'")).rows.length,
      1,
      "a label becomes public with an approved published work",
    );
  } finally {
    await db.close();
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";

test("real Postgres RLS: every table, ownership, roles, MFA and bootstrap", async () => {
  const db = new PGlite();
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,last_sign_in_at timestamptz);
    create table auth.mfa_factors(id uuid primary key default gen_random_uuid(),user_id uuid,factor_type text,status text);
    create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
    create function auth.uid() returns uuid language sql stable as $$select nullif(auth.jwt()->>'sub','')::uuid$$;
    grant usage on schema public,auth to anon,authenticated,service_role;
    grant execute on function auth.uid(),auth.jwt() to anon,authenticated,service_role;
  `);
  for (const file of fs
    .readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.exec(fs.readFileSync(`supabase/migrations/${file}`, "utf8"));
  const a = "11111111-1111-4111-8111-111111111111";
  const b = "22222222-2222-4222-8222-222222222222";
  const admin = "33333333-3333-4333-8333-333333333333";
  const wa = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const wb = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const approved = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
  async function as(role: string, uid = "", aal = "aal1") {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claims',$1,false)", [
      JSON.stringify({
        role,
        sub: uid,
        aal,
        amr: aal === "aal2" ? [{ method: "totp", timestamp: Math.floor(Date.now() / 1000) }] : [],
      }),
    ]);
    await db.exec(`set role ${role}`);
  }
  try {
    await db.exec(`
      insert into auth.users(id,email,email_confirmed_at,last_sign_in_at) values
      ('${a}','owner@example.invalid',now(),now()),('${b}','other@example.invalid',now(),now()),('${admin}','admin@example.invalid',null,null);
      insert into public.categories values('workers','Workers');
      insert into public.formats values('poster-placard','Poster/Placard');
      insert into public.licences values('CC0-1.0','https://creativecommons.org/publicdomain/zero/1.0/',true,true,false),('CC-BY-NC-ND-4.0','https://creativecommons.org/licenses/by-nc-nd/4.0/',false,false,false);
      insert into public.roles values('${admin}','admin');
      insert into public.messages(submission_key,topic,body) values(gen_random_uuid(),'General','Private test message');
      insert into public.audit_log(action) values('private-test');
    `);
    await as("service_role");
    for (const [id, owner, status, publication] of [
      [wa, a, "draft", "private"],
      [wb, b, "pending", "private"],
      [approved, b, "approved", "published"],
    ])
      await db.query(
        `insert into public.works(id,owner_id,slug,title,artist_name,alt,source,licence_id,format_slug,status,publication_state) values($1,$2,$3,'Test art','Pseudonym','A black arrow on white paper.','https://example.invalid/work','CC0-1.0','poster-placard',$4,$5)`,
        [id, owner, id, status, publication],
      );
    await db.query(
      `insert into public.work_files(work_id,object_key,public_key,kind,mime,bytes) values($1,'private-original',null,'sanitized','image/png',100),($2,'private-approved','approved-file','sanitized','image/png',100)`,
      [wa, approved],
    );
    await as("anon");
    assert.equal(
      (await db.query<{ public_catalogue: unknown[] }>("select public.public_catalogue()")).rows[0]
        .public_catalogue.length,
      1,
    );
    assert.equal((await db.query("select id from public.works")).rows.length, 1);
    assert.equal((await db.query("select public_key from public.work_files")).rows.length, 1);
    await assert.rejects(db.query("select object_key from public.work_files"));
    for (const table of [
      "messages",
      "takedown_requests",
      "audit_log",
      "roles",
      "app_sessions",
      "uploads",
      "rate_limits",
      "mail_jobs",
      "guest_submissions",
    ])
      await assert.rejects(db.query(`select * from public.${table}`), table);
    await assert.rejects(db.query("select public.bootstrap_admin('admin@example.invalid')"));
    await as("authenticated", a);
    assert.deepEqual(
      (await db.query<{ id: string }>("select id from public.works")).rows.map((r) => r.id),
      [wa],
    );
    assert.equal((await db.query("select * from public.work_files")).rows.length, 1);
    await db.query("update public.works set title='My edited art' where id=$1", [wa]);
    assert.equal(
      (await db.query("update public.works set title='Stolen' where id=$1 returning id", [wb])).rows
        .length,
      0,
    );
    await assert.rejects(
      db.query("insert into public.roles(user_id,role) values($1,'admin')", [a]),
    );
    await assert.rejects(db.query("update public.works set status='approved' where id=$1", [wa]));
    await assert.rejects(
      db.query("update public.works set licence_id='CC-BY-NC-ND-4.0',remixable=true where id=$1", [
        wa,
      ]),
    );
    await assert.rejects(
      db.query("update public.works set public_url='https://example.invalid/fake' where id=$1", [
        wa,
      ]),
    );
    for (const table of ["messages", "takedown_requests", "audit_log"])
      assert.equal((await db.query(`select * from public.${table}`)).rows.length, 0, table);
    await as("authenticated", admin, "aal1");
    assert.equal(
      (await db.query("select * from public.messages")).rows.length,
      0,
      "admin without MFA cannot read inbox",
    );
    await as("authenticated", admin, "aal2");
    assert.equal((await db.query("select * from public.messages")).rows.length, 1);
    await db.query(
      "update public.works set status='changes_requested',feedback='Please revise' where id=$1",
      [wb],
    );
    await assert.rejects(
      db.query("update public.works set status='approved' where id=$1", [wb]),
      "review cannot approve a work outside the pending state",
    );
    await db.query("select public.audit_admin_operation('retry_publish')");
    await db.query("select public.review_categories($1,array['workers'])", [wb]);
    assert.equal(
      (await db.query("select * from public.work_categories where work_id=$1", [wb])).rows.length,
      1,
    );
    await assert.rejects(
      db.query("select public.review_categories($1,array['not-a-canonical-category'])", [wb]),
    );
    assert.equal(
      (await db.query("select * from public.work_categories where work_id=$1", [wb])).rows.length,
      1,
      "invalid category edit is atomic",
    );
    assert.ok(
      (await db.query("select * from public.audit_log where action='works:UPDATE'")).rows.length,
    );
    await db.query("select set_config('request.jwt.claims',$1,false)", [
      JSON.stringify({
        role: "authenticated",
        sub: admin,
        aal: "aal2",
        amr: [{ method: "totp", timestamp: Math.floor(Date.now() / 1000) - 1000 }],
      }),
    ]);
    await assert.rejects(
      db.query("update public.works set status='rejected' where id=$1", [wb]),
      "stale admin authentication cannot moderate",
    );
    await assert.rejects(
      db.query("select public.audit_admin_operation('retry_publish')"),
      "retrying publication also requires fresh TOTP",
    );
    await as("service_role");
    await assert.rejects(
      db.query("select public.bootstrap_admin('admin@example.invalid')"),
      "no unverified bootstrap",
    );
    await db.exec("reset role");
    await db.query(
      "update auth.users set email_confirmed_at=now(),last_sign_in_at=now() where id=$1",
      [admin],
    );
    await as("service_role");
    await assert.rejects(
      db.query("select public.bootstrap_admin('admin@example.invalid')"),
      "no bootstrap without verified TOTP",
    );
    await db.exec("reset role");
    await db.query(
      "insert into auth.mfa_factors(user_id,factor_type,status) values($1,'totp','verified')",
      [admin],
    );
    await db.query("delete from public.roles where user_id=$1", [admin]);
    await as("service_role");
    await db.query("select public.bootstrap_admin('admin@example.invalid')");
    await db.query("select public.bootstrap_admin('admin@example.invalid')");
    assert.equal(
      (await db.query("select * from public.roles where user_id=$1", [admin])).rows.length,
      1,
    );
    assert.equal(
      (await db.query("select * from public.audit_log where action='admin_bootstrap'")).rows.length,
      1,
    );
    await db.exec("reset role");
    const tables = await db.query<{ relname: string; relrowsecurity: boolean }>(
      "select relname,relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'",
    );
    assert.ok(tables.rows.length >= 20);
    assert.ok(
      tables.rows.every((row) => row.relrowsecurity),
      "RLS enabled on every application table",
    );
    const guestWork = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
    const guestTicket = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
    await db.query(
      `insert into public.works(id,slug,title,artist_name,alt,source,licence_id,format_slug)
      values($1,'guest-fixture','Guest fixture','Anonymous contributor','An original black circle.','https://example.invalid/guest','CC0-1.0','poster-placard')`,
      [guestWork],
    );
    await db.query(
      "insert into public.guest_submissions(token_hash,work_id,contact) values($1,$2,'private@example.invalid')",
      ["a".repeat(64), guestWork],
    );
    await as("authenticated", a);
    assert.equal((await db.query("select * from public.guest_submissions")).rows.length, 0);
    await assert.rejects(
      db.query("select public.finish_guest_upload($1,$2,now(),'[]')", [guestTicket, guestWork]),
    );
    await as("authenticated", admin, "aal1");
    assert.equal((await db.query("select * from public.guest_submissions")).rows.length, 0);
    await as("authenticated", admin, "aal2");
    assert.equal((await db.query("select * from public.guest_submissions")).rows.length, 1);
    await as("service_role");
    await db.query(
      `insert into public.uploads(id,user_id,work_id,object_key,mime,bytes,expires_at,state)
      values($1,null,$2,'quarantine/guest-fixture','image/png',100,now()+interval '5 minutes','processing')`,
      [guestTicket, guestWork],
    );
    const guestUpdated = (
      await db.query<{ updated_at: string }>("select updated_at from public.works where id=$1", [
        guestWork,
      ])
    ).rows[0].updated_at;
    const guestFiles = ["sanitized", "preview", "pdf-a4", "pdf-a2"].map((kind) => ({
      kind,
      object_key: `guest-fixture/${kind}`,
      mime: kind.startsWith("pdf") ? "application/pdf" : "image/png",
      bytes: 100,
      width: 100,
      height: 100,
      dpi: 72,
    }));
    await assert.rejects(
      db.query("select public.finish_guest_upload($1,$2,$3,$4)", [
        guestTicket,
        wa,
        guestUpdated,
        JSON.stringify(guestFiles),
      ]),
    );
    await db.query("select public.finish_guest_upload($1,$2,$3,$4)", [
      guestTicket,
      guestWork,
      guestUpdated,
      JSON.stringify(guestFiles),
    ]);
    assert.equal(
      (await db.query("select * from public.work_files where work_id=$1", [guestWork])).rows.length,
      4,
    );
    await db.query("delete from public.works where id=$1", [guestWork]);
    await db.exec("reset role");
    await db.exec(fs.readFileSync("supabase/seed.sql", "utf8"));
    await db.exec(fs.readFileSync("supabase/seed.sql", "utf8"));
    assert.equal(
      (await db.query<{ n: number }>("select count(*)::int n from public.categories")).rows[0].n,
      28,
    );
    assert.equal(
      (await db.query<{ n: number }>("select count(*)::int n from public.formats")).rows[0].n,
      10,
    );
    await as("service_role");
    const receipt = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
    const ticket = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
    await db.query(
      "insert into public.uploads(id,user_id,work_id,object_key,mime,bytes,expires_at,state) values($1,$2,$3,'quarantine-test','image/png',100,now()+interval '5 minutes','processing')",
      [ticket, a, wa],
    );
    const updated = (
      await db.query<{ stamp: string }>(
        "select updated_at::text stamp from public.works where id=$1",
        [wa],
      )
    ).rows[0].stamp;
    const files = ["sanitized", "preview", "pdf-a4", "pdf-a2"].map((kind, i) => ({
      object_key: `sanitized-test-${i}`,
      kind,
      mime: kind.startsWith("pdf") ? "application/pdf" : "image/png",
      bytes: 100,
      width: 40,
      height: 60,
      dpi: 5,
    }));
    await assert.rejects(
      db.query("select public.finish_upload($1,$2,$3,$4)", [
        ticket,
        a,
        "2000-01-01T00:00:00Z",
        JSON.stringify(files),
      ]),
    );
    assert.equal(
      (await db.query("select * from public.work_files where work_id=$1", [wa])).rows.length,
      1,
      "failed finalization preserves the old metadata",
    );
    await db.query("select public.finish_upload($1,$2,$3,$4)", [
      ticket,
      a,
      updated,
      JSON.stringify(files),
    ]);
    assert.equal(
      (await db.query("select * from public.work_files where work_id=$1", [wa])).rows.length,
      4,
    );
    await assert.rejects(
      db.query("select public.finish_upload($1,$2,$3,$4)", [
        ticket,
        a,
        updated,
        JSON.stringify(files),
      ]),
      "upload ticket cannot be reused",
    );
    await db.query(
      "select public.store_message($1,'General','Message with enough detail','owner@example.invalid','en','')",
      [receipt],
    );
    await db.query(
      "select public.store_message($1,'General','Message with enough detail','owner@example.invalid','en','')",
      [receipt],
    );
    assert.equal(
      (await db.query("select * from public.mail_jobs")).rows.length,
      2,
      "receipt retries do not duplicate mail jobs",
    );
    await assert.rejects(
      db.query(
        "select public.store_message($1,'General','Different message content','owner@example.invalid','en','')",
        [receipt],
      ),
    );
  } finally {
    await db.close();
  }
});

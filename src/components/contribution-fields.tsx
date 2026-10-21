"use client";
import { useId, useState } from "react";
import { useI18n } from "@/i18n/client";
import {
  imageDescription,
  licenceChoices,
  normalizeTags,
  selectedLicence,
} from "@/lib/contribution-metadata";
import { LICENSES } from "@/lib/types";
import suggestions from "../../content/tags.json";
import categories from "../../content/categories.json";

export function DescriptionField({
  initial = "",
  fallback,
  inputId,
}: {
  initial?: string;
  fallback?: Parameters<typeof imageDescription>[0];
  inputId?: string;
}) {
  const { t } = useI18n();
  const generatedId = useId();
  const id = inputId || generatedId;
  const [value, setValue] = useState(initial);
  return (
    <div className="form-field">
      <label htmlFor={id}>{t("Describe the image (optional)")}</label>
      <textarea
        id={id}
        name="alt"
        maxLength={300}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-describedby={`${id}-help ${id}-count`}
      />
      <p id={`${id}-help`}>
        {t(
          "Helps blind and low-vision visitors. One or two plain sentences: what is shown and any text on it.",
        )}
      </p>
      <span id={`${id}-count`} aria-live="polite">
        {value.length} / 300
      </span>
      {!value.trim() && fallback && (
        <p className="notice">
          {t("Fallback description in use:")} {imageDescription(fallback)}
        </p>
      )}
    </div>
  );
}

export function TagsField({ initial = [] }: { initial?: string[] }) {
  const { t } = useI18n();
  const id = useId();
  const [tags, setTags] = useState(initial);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [error, setError] = useState("");
  const matches = suggestions.filter((s) =>
    `${s} ${t(s)}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
  function commit(value = query) {
    try {
      setTags(normalizeTags([...tags, value]));
      setQuery("");
      setError("");
      setActive(-1);
    } catch (e) {
      setError(
        t(
          e instanceof Error && e.message === "too_many_tags"
            ? "Choose up to 10 tags."
            : "Keep each tag to 30 characters or fewer.",
        ),
      );
    }
  }
  return (
    <fieldset className="metadata-field">
      <legend>{t("Tags")}</legend>
      <div className="metadata-chips">
        {tags.map((tag) => (
          <span className="metadata-chip" key={tag}>
            {t(tag)}
            <input type="hidden" name="tags" value={tag} />
            <button
              type="button"
              aria-label={`${t("Remove tag")} ${tag}`}
              onClick={() => setTags(tags.filter((v) => v !== tag))}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <label className="sr-only" htmlFor={id}>
        {t("Tags")}
      </label>
      <div className="metadata-add">
        <input
          id={id}
          name="tag_pending"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-activedescendant={open && active >= 0 ? `${id}-option-${active}` : undefined}
          aria-describedby={`${id}-help ${id}-error`}
          aria-invalid={!!error}
          value={query}
          enterKeyHint="done"
          maxLength={200}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onBlur={() => {
            if (query.trim()) commit();
            setOpen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit(active >= 0 && open ? matches[active] : query);
            } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              setOpen(true);
              setActive((a) =>
                matches.length
                  ? (a + (e.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length
                  : -1,
              );
            } else if (e.key === "Escape") {
              e.preventDefault();
              setOpen(false);
            } else if (e.key === "Backspace" && !query) setTags(tags.slice(0, -1));
          }}
        />
        <button
          className="button"
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => commit()}
        >
          {t("Add")}
        </button>
      </div>
      <p id={`${id}-help`}>
        {t("Other: type your own")} · {t("Press Enter or comma to add a tag.")}
      </p>
      <p id={`${id}-error`} className="field-error" aria-live="polite">
        {error}
      </p>
      {open && (
        <ul
          id={`${id}-list`}
          role="listbox"
          aria-label={t("Suggested tags")}
          aria-multiselectable="true"
          className="tag-options"
        >
          {matches.map((tag, i) => (
            <li
              id={`${id}-option-${i}`}
              role="option"
              aria-selected={tags.includes(tag)}
              key={tag}
              className={i === active ? "active" : undefined}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => commit(tag)}
            >
              {t(tag)}
              {tags.includes(tag) ? " ✓" : ""}
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}

export function CategoriesField({ initial = [] }: { initial?: string[] }) {
  const { t, locale } = useI18n();
  const id = useId();
  const [selected, setSelected] = useState(initial);
  const [query, setQuery] = useState("");
  const label = (c: (typeof categories)[number]) =>
    locale === "en" || t(c.label) === c.label ? t(c.label) : `${t(c.label)} / ${c.label}`;
  return (
    <fieldset className="metadata-field">
      <legend>{t("Categories (multiple selections allowed)")}</legend>
      <p aria-live="polite">
        {selected.length} {t("selected")}
      </p>
      <div className="metadata-chips">
        {selected.map((slug) => {
          const c = categories.find((c) => c.slug === slug);
          return (
            c && (
              <span className="metadata-chip" key={slug}>
                {label(c)}
                <button
                  type="button"
                  aria-label={`${t("Remove category")} ${c.label}`}
                  onClick={() => setSelected(selected.filter((s) => s !== slug))}
                >
                  ×
                </button>
              </span>
            )
          );
        })}
      </div>
      {selected.map((slug) => (
        <input type="hidden" name="categories" value={slug} key={slug} />
      ))}
      <label htmlFor={id}>{t("Search categories")}</label>
      <input
        id={id}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.preventDefault();
        }}
      />
      <div className="category-options">
        {categories
          .filter((c) =>
            `${label(c)} ${c.slug}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
          )
          .map((c) => (
            <label className="checkbox-field" key={c.slug}>
              <input
                type="checkbox"
                checked={selected.includes(c.slug)}
                onChange={(e) =>
                  setSelected(
                    e.target.checked ? [...selected, c.slug] : selected.filter((s) => s !== c.slug),
                  )
                }
              />
              {label(c)}
            </label>
          ))}
      </div>
      {!selected.length && <p>{t("ALL (Uncategorized)")}</p>}
      {selected.length > 5 && (
        <p>{t("Choose the most relevant categories to help people find your work.")}</p>
      )}
    </fieldset>
  );
}

export function LicenceField({ initial = "CC-BY-SA-4.0" }: { initial?: string }) {
  const { t } = useI18n();
  const id = useId();
  const [choice, setChoice] = useState<string>(
    (licenceChoices.find((c) => c.regular === initial || c.nc === initial) || licenceChoices[0]).id,
  );
  const [nc, setNc] = useState(initial.includes("-NC-"));
  const licence = selectedLicence(choice, nc);
  return (
    <fieldset className="metadata-field">
      <legend>{t("How may people use your work?")}</legend>
      <input type="hidden" id="upload-licence" name="licence_id" value={licence} />
      <input type="hidden" name="remixable" value="true" />
      <div className="licence-cards">
        {licenceChoices.map((c) => (
          <label className="checkbox-field licence-card" key={c.id}>
            <input
              type="radio"
              name={`${id}-licence-choice`}
              value={c.id}
              checked={choice === c.id}
              onChange={() => {
                setChoice(c.id);
                if (c.id === "free") setNc(false);
              }}
            />
            {t(c.label)}
          </label>
        ))}
      </div>
      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={nc}
          disabled={choice === "free"}
          onChange={(e) => setNc(e.target.checked)}
          aria-describedby={choice === "free" ? `${id}-cc0` : undefined}
        />
        {t("Only for non-commercial use (nobody can sell it)")}
      </label>
      {choice === "free" && <p id={`${id}-cc0`}>{t("CC0 cannot restrict commercial use.")}</p>}
      <p>{t("Not sure? Leave the recommended option; you can ask us to change it later.")}</p>
      <details>
        <summary>{t("See the legal details")}</summary>
        <p>
          <a href={LICENSES[licence].url} rel="noreferrer">
            {licence}
          </a>
        </p>
      </details>
    </fieldset>
  );
}

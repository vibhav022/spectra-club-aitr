"use client";

/* eslint-disable @next/next/no-img-element -- admin previews use ImageKit URLs */
import { useState } from "react";
import {
  
  Eye,
  EyeOff,
  Film,
  ImagePlus,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  api,
  ApiError,
  mediaUrl,
} from "@/lib/admin/api";
import { PageHead } from "./AdminShell";
import { EventMediaField } from "./EventMediaField";
import {
  btnSmall,
  EmptyState,
  ErrorBox,
  Field,
  inputCls,
  Loading,
  Modal,
  Spinner,
  Toggle,
  useAdminData,
  useConfirm,
  useToast,
} from "./ui";

type Category = string;

type Wash = "magenta" | "blue" | "teal" | "green";

interface CatalogueEvent {
  id: string;
  slug: string;
  title: string;
  category: Category;
  description: string;
  year: number | null;
  date: string | null;
  venue: string | null;
  instagramUrl: string | null;
  highlights: string[];
  wash: Wash;
  posterMediaId: string | null;
  videoMediaId: string | null;
  image: string | null;
  video: string | null;
  visible: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const PATH = "/api/admin/catalogue-events";

const CATEGORIES: Category[] = [
  "Cultural",
  "Community / Outreach",
  "Club Onboarding",
  "Tech",
  "Sports",
  "Literary",
];

const WASHES: { value: Wash; label: string }[] = [
  { value: "teal", label: "Teal" },
  { value: "blue", label: "Blue" },
  { value: "magenta", label: "Magenta" },
  { value: "green", label: "Green" },
];

const EMPTY_EVENT = {
  title: "",
  slug: "",
  category: "Tech" as Category,
  description: "",
  year: "",
  date: "",
  venue: "",
  instagramUrl: "",
  highlights: "",
  wash: "teal" as Wash,
};

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function CatalogueEventsManager() {
  const toast = useToast();
  const confirm = useConfirm();

  const {
    data,
    error,
    loading,
    reload,
    setData,
  } = useAdminData(() =>
    api<{ items: CatalogueEvent[] }>(PATH).then((r) => r.items)
  );

  const [edit, setEdit] = useState<CatalogueEvent | "new" | null>(
    null
  );
  const [busy, setBusy] = useState<string | null>(null);

  const items = data ?? [];

  const setVisible = async (
    event: CatalogueEvent,
    visible: boolean
  ) => {
    setBusy(event.id);

    try {
      await api(`${PATH}/${event.id}`, {
        method: "PATCH",
        json: { visible },
      });

      setData(
        items.map((item) =>
          item.id === event.id ? { ...item, visible } : item
        )
      );

      toast(
        "ok",
        visible
          ? "Event published on the website."
          : "Event hidden from the website."
      );
    } catch (e) {
      toast("err", (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const remove = async (event: CatalogueEvent) => {
    if (
      !(await confirm({
        title: `Delete ${event.title}?`,
        body: "This permanently deletes the event from the catalogue. Its attached media will also be removed if it is no longer used elsewhere. This cannot be undone.",
      }))
    ) {
      return;
    }

    setBusy(event.id);

    try {
      await api(`${PATH}/${event.id}`, {
        method: "DELETE",
      });

      setData(items.filter((item) => item.id !== event.id));
      toast("ok", "Event deleted.");
    } catch (e) {
      toast("err", (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHead
        title="Event Catalogue"
        text="Create, edit and publish events displayed on the public Events page."
      >
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setEdit("new")}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add event
        </button>
      </PageHead>

      {error && <ErrorBox message={error} onRetry={reload} />}

      {loading && !data ? (
        <Loading />
      ) : !error && items.length === 0 ? (
        <EmptyState
          title="No catalogue events yet"
          text="Add your first event. It will appear on the public Events page once published."
        >
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setEdit("new")}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add first event
          </button>
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((event) => (
            <li
              key={event.id}
              className={`glass overflow-hidden rounded-[var(--radius-card)] ${
                event.visible ? "" : "opacity-75"
              }`}
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-surface">
                {event.image ? (
                  <img
                    src={mediaUrl(event.image)}
                    alt={`${event.title} poster`}
                    className="h-full w-full object-cover"
                  />
                ) : event.video ? (
                  <div className="flex h-full items-center justify-center">
                    <Film
                      className="h-12 w-12 text-white/30"
                      aria-hidden="true"
                    />
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImagePlus
                      className="h-12 w-12 text-white/20"
                      aria-hidden="true"
                    />
                  </div>
                )}

                <span
                  className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-medium ${
                    event.visible
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-black/60 text-white/70"
                  }`}
                >
                  {event.visible ? "Published" : "Hidden"}
                </span>
              </div>

              <div className="p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-accent">
                  {event.category}
                </p>

                <h3 className="mt-2 truncate text-lg font-semibold text-ink">
                  {event.title}
                </h3>

                <p className="mt-1 truncate text-sm text-ink-soft">
                  /events/{event.slug}/
                </p>

                <div className="mt-2 flex flex-wrap gap-3 text-xs text-ink-soft">
                  {event.year && <span>{event.year}</span>}
                  {event.date && <span>{event.date}</span>}
                  {event.venue && <span>{event.venue}</span>}
                </div>

                {event.video && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-ink-soft">
                    <Film className="h-3.5 w-3.5" />
                    Video attached
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className={btnSmall}
                    onClick={() => setEdit(event)}
                  >
                    <Pencil
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                    Edit
                  </button>

                  <button
                    type="button"
                    className={btnSmall}
                    onClick={() =>
                      setVisible(event, !event.visible)
                    }
                    disabled={busy === event.id}
                  >
                    {event.visible ? (
                      <EyeOff
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    ) : (
                      <Eye
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    )}
                    {event.visible ? "Hide" : "Publish"}
                  </button>

                  <button
                    type="button"
                    className={btnSmall}
                    onClick={() => remove(event)}
                    disabled={busy === event.id}
                    aria-label={`Delete ${event.title}`}
                  >
                    <Trash2
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {edit && (
        <CatalogueEventForm
          event={edit === "new" ? null : edit}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            reload();
          }}
        />
      )}
    </>
  );
}

function CatalogueEventForm({
  event,
  onClose,
  onSaved,
}: {
  event: CatalogueEvent | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();

  const [values, setValues] = useState(() => ({
    ...EMPTY_EVENT,
    title: event?.title ?? "",
    slug: event?.slug ?? "",
    category: event?.category ?? "Tech",
    description: event?.description ?? "",
    year: event?.year ? String(event.year) : "",
    date: event?.date ?? "",
    venue: event?.venue ?? "",
    instagramUrl: event?.instagramUrl ?? "",
    highlights: event?.highlights?.join("\n") ?? "",
    wash: event?.wash ?? "teal",
  }));

  const [slugEdited, setSlugEdited] = useState(!!event);

  const [poster, setPoster] = useState<{
    id: string | null;
    url: string | null;
  }>({
    id: event?.posterMediaId ?? null,
    url: event?.image ? mediaUrl(event.image) ?? null : null,
  });

  const [video, setVideo] = useState<{
    id: string | null;
    url: string | null;
  }>({
    id: event?.videoMediaId ?? null,
    url: event?.video ? mediaUrl(event.video) ?? null : null,
  });

  const [visible, setVisible] = useState(event?.visible ?? false);
  const [busy, setBusy] = useState(false);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [formErr, setFormErr] = useState("");

  const set = (key: string) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const value = e.target.value;

      setValues((current) => {
        const next = { ...current, [key]: value };

        if (key === "title" && !slugEdited) {
          next.slug = makeSlug(value);
        }

        return next;
      });
    };

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setBusy(true);
    setErrs({});
    setFormErr("");

    const highlights = values.highlights
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const body = {
      title: values.title.trim(),
      slug: values.slug.trim(),
      category: values.category,
      description: values.description.trim(),
      year: values.year ? Number(values.year) : null,
      date: values.date || null,
      venue: values.venue.trim() || null,
      instagramUrl: values.instagramUrl.trim() || null,
      highlights,
      wash: values.wash,
      posterMediaId: poster.id,
      videoMediaId: video.id,
      visible,
    };

    try {
      if (event) {
        await api(`${PATH}/${event.id}`, {
          method: "PATCH",
          json: body,
        });
      } else {
        await api(PATH, {
          method: "POST",
          json: body,
        });
      }

      toast("ok", event ? "Event updated." : "Event created.");
      onSaved();
    } catch (err) {
      const apiError = err as ApiError;
      setErrs(apiError.fields ?? {});
      setFormErr(apiError.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={event ? `Edit ${event.title}` : "Add catalogue event"}
      onClose={onClose}
      wide
    >
      <form onSubmit={save} className="space-y-5" noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <EventMediaField
            kind="image"
            label="Event poster"
            url={poster.url}
            onChange={setPoster}
          />

          <EventMediaField
            kind="video"
            label="Event video (optional)"
            url={video.url}
            onChange={setVideo}
          />
        </div>

        <Field label="Event title" error={errs.title}>
          {(p) => (
            <input
              {...p}
              value={values.title}
              onChange={set("title")}
              className={inputCls}
              maxLength={120}
              required
              placeholder="e.g. Code Red"
            />
          )}
        </Field>

        <Field
          label="URL slug"
          error={errs.slug}
          hint="Used in the event URL. Use lowercase letters, numbers and hyphens."
        >
          {(p) => (
            <input
              {...p}
              value={values.slug}
              onChange={(e) => {
                setSlugEdited(true);
                setValues((current) => ({
                  ...current,
                  slug: e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "-")
                    .replace(/-+/g, "-")
                    .replace(/^-+|-+$/g, ""),
                }));
              }}
              className={inputCls}
              maxLength={120}
              required
              placeholder="code-red"
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" error={errs.category}>
            {(p) => (
              <Field
  label="Category"
  error={errs.category}
  hint="Choose an existing category or type a new one."
>
  {(p) => (
    <>
      <input
        {...p}
        list="catalogue-event-categories"
        value={values.category}
        onChange={set("category")}
        className={inputCls}
        maxLength={80}
        required
        placeholder="e.g. Workshops"
      />

      <datalist id="catalogue-event-categories">
        {CATEGORIES.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>
    </>
  )}
</Field>
            )}
          </Field>

          <Field label="Theme colour" error={errs.wash}>
            {(p) => (
              <select
                {...p}
                value={values.wash}
                onChange={set("wash")}
                className={inputCls}
              >
                {WASHES.map((wash) => (
                  <option key={wash.value} value={wash.value}>
                    {wash.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>

        <Field label="Description" error={errs.description}>
          {(p) => (
            <textarea
              {...p}
              rows={5}
              value={values.description}
              onChange={set("description")}
              className={inputCls}
              maxLength={3000}
              required
              placeholder="Describe the event..."
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Event year (optional)" error={errs.year}>
            {(p) => (
              <input
                {...p}
                type="number"
                min={1900}
                max={2100}
                value={values.year}
                onChange={set("year")}
                className={inputCls}
                placeholder="2026"
              />
            )}
          </Field>

          <Field label="Event date (optional)" error={errs.date}>
            {(p) => (
              <input
                {...p}
                type="date"
                value={values.date}
                onChange={set("date")}
                className={inputCls}
              />
            )}
          </Field>
        </div>

        <Field label="Venue (optional)" error={errs.venue}>
          {(p) => (
            <input
              {...p}
              value={values.venue}
              onChange={set("venue")}
              className={inputCls}
              maxLength={160}
              placeholder="e.g. AITR Auditorium"
            />
          )}
        </Field>

        <Field
          label="Instagram link (optional)"
          error={errs.instagramUrl}
        >
          {(p) => (
            <input
              {...p}
              type="url"
              inputMode="url"
              value={values.instagramUrl}
              onChange={set("instagramUrl")}
              className={inputCls}
              placeholder="https://www.instagram.com/..."
            />
          )}
        </Field>

        <Field
          label="Event highlights"
          error={errs.highlights}
          hint="Enter one highlight per line. Maximum 20 highlights."
        >
          {(p) => (
            <textarea
              {...p}
              rows={4}
              value={values.highlights}
              onChange={set("highlights")}
              className={inputCls}
              placeholder={"Live coding challenge\nTeam competitions\nAwards and recognition"}
            />
          )}
        </Field>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-ink">
              Publish event
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              Published events appear on the public Events page.
            </p>
          </div>

          <Toggle
            checked={visible}
            onChange={setVisible}
            label="Visible on website"
          />
        </div>

        {formErr && (
          <p role="alert" className="text-sm text-danger-text">
            {formErr}
          </p>
        )}

        <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy}
          >
            {busy ? (
              <>
                <Spinner className="h-4 w-4" />
                Saving…
              </>
            ) : event ? (
              "Save changes"
            ) : (
              "Create event"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
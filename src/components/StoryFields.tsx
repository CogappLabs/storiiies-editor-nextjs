"use client";

import { type Ref, useId } from "react";
import type { Story } from "@/generated/prisma/client";
import { useStrings } from "@/lib/i18n/LanguageProvider";

interface StoryFieldsProps {
  story?: Pick<Story, "title" | "author" | "description" | "attribution">;
  titleRef?: Ref<HTMLInputElement>;
}

const inputClass = "w-full px-3 py-2 border border-cogapp-charcoal/20 rounded";

/** Uncontrolled inputs named for the story server actions' FormData. */
const StoryFields = ({ story, titleRef }: StoryFieldsProps) => {
  const strings = useStrings().storyFields;
  const id = useId();
  const field = (name: string) => `${id}-${name}`;

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor={field("title")}
          className="block text-sm font-medium mb-1"
        >
          {strings.title}
        </label>
        <input
          id={field("title")}
          name="title"
          ref={titleRef}
          defaultValue={story?.title}
          placeholder={strings.titlePlaceholder}
          className={inputClass}
          required
        />
      </div>
      <div>
        <label
          htmlFor={field("author")}
          className="block text-sm font-medium mb-1"
        >
          {strings.author}
        </label>
        <input
          id={field("author")}
          name="author"
          defaultValue={story?.author ?? ""}
          className={inputClass}
        />
      </div>
      <div>
        <label
          htmlFor={field("description")}
          className="block text-sm font-medium mb-1"
        >
          {strings.description}
        </label>
        <textarea
          id={field("description")}
          name="description"
          defaultValue={story?.description ?? ""}
          rows={3}
          className={inputClass}
        />
      </div>
      <div>
        <label
          htmlFor={field("attribution")}
          className="block text-sm font-medium mb-1"
        >
          {strings.attribution}
        </label>
        <input
          id={field("attribution")}
          name="attribution"
          defaultValue={story?.attribution ?? ""}
          className={inputClass}
        />
      </div>
    </div>
  );
};

export default StoryFields;

'use client';

import { useId } from 'react';
import type { FormEvent } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertIcon, GlobeIcon, TestIcon } from '@/components/ui/icons';
import { cn } from '@/lib/cn';
import { EXAMPLE_TARGETS } from '@/utils/constants';
import { formatUrlForDisplay } from '@/utils/url';

export interface UrlInputProps {
  readonly value: string;
  readonly error: string | null;
  readonly onChange: (value: string) => void;
  readonly onSubmit: () => void;
}

export function UrlInput({ value, error, onChange, onSubmit }: UrlInputProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="border-app-border bg-app-panel flex flex-col gap-2 border-b px-3 py-2.5"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <label htmlFor={inputId} className="sr-only">
            Website URL to test
          </label>
          <Input
            id={inputId}
            value={value}
            inputMode="url"
            autoComplete="url"
            spellCheck={false}
            placeholder="example.com, localhost:3000 or https://staging.example.com"
            leading={<GlobeIcon className="text-base" />}
            invalid={error !== null}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => onChange(event.target.value)}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          icon={<TestIcon />}
          className="h-11 sm:h-9 sm:w-32"
        >
          Test
        </Button>
      </div>

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-app-danger flex items-center gap-1.5 text-xs"
        >
          <AlertIcon className="shrink-0" />
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-app-subtle text-[11px]">Try</span>
        {EXAMPLE_TARGETS.map((example) => {
          const active =
            formatUrlForDisplay(value) === formatUrlForDisplay(example);
          return (
            <button
              key={example}
              type="button"
              onClick={() => onChange(example)}
              className={cn(
                'h-6 rounded border px-1.5 font-mono text-[11px] transition-colors',
                active
                  ? 'border-app-accent/60 bg-app-accent/15 text-app-accent'
                  : 'border-app-border text-app-subtle hover:border-app-border-strong hover:text-app-text',
              )}
            >
              {example.replace(/^https?:\/\//, '')}
            </button>
          );
        })}
      </div>
    </form>
  );
}

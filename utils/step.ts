import { test } from '@playwright/test';
import { isRealCredential } from '@utils/auth/ui-credentials-guard';

type AsyncMethod<This, Args extends unknown[], Return> = (
  this: This,
  ...args: Args
) => Promise<Return>;

export function step(title: string) {
  return function <This, Args extends unknown[], Return>(
    method: AsyncMethod<This, Args, Return>,
  ) {
    return function (this: This, ...args: Args): Promise<Return> {
      return test.step(
        fillPlaceholders(title, args),
        () => method.call(this, ...args),
        { box: true },
      );
    };
  };
}

function fillPlaceholders(title: string, args: unknown[]): string {
  return title.replace(
    /\{(\d+)(?:\.(\w+))?\}/g,
    (placeholder, index, field) => {
      const arg = args[Number(index)];
      const value = field ? (arg as Record<string, unknown>)?.[field] : arg;
      if (value === undefined) return placeholder;
      return isRealCredential(String(value)) ? '***' : String(value);
    },
  );
}

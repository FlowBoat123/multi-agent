import { PropsWithChildren } from 'react';
import { SWRConfig } from 'swr';

const swrConfig = {
  provider: () => new Map(),
};

export const withSWR = ({ children }: PropsWithChildren) => (
  <SWRConfig value={swrConfig}>{children}</SWRConfig>
);

interface TestServiceOptions {
  checkAsync?: boolean;
  extraChecks?: (method: string, func: () => any) => void;
  skipMethods?: string[];
}

const builtinSkipProps = new Set(['userId']);

export const testService = (ServiceClass: new () => any, options: TestServiceOptions = {}) => {
  const { checkAsync = true, skipMethods = ['userId'], extraChecks } = options;

  describe(ServiceClass.name, () => {
    it('should implement all methods as arrow functions', () => {
      const service = new ServiceClass();

      const methods = Object.getOwnPropertyNames(service).filter(
        (method) => !builtinSkipProps.has(method) || !skipMethods.includes(method),
      );

      methods.forEach((method) => {
        const func = service[method];
        expect(typeof func).toBe('function');

        const funcString = func.toString();

        expect(funcString).toContain('=>');

        if (checkAsync) {
          expect(funcString).toMatch(/^async.*=>/);
        }

        if (extraChecks) {
          extraChecks(method, func);
        }
      });
    });
  });
};

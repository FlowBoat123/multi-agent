import { debounce } from 'lodash-es';
import { startTransition, useCallback, useEffect, useState } from 'react';

import { encodeAsync } from '@/utils/tokenizer';

export const useTokenCount = (input: string = '') => {
  const [value, setNum] = useState(0);

  const debouncedEncode = useCallback(
    debounce((text: string) => {
      encodeAsync(text)
        .then(setNum)
        .catch(() => {
          setNum(text.length);
        });
    }, 120),
    [],
  );

  useEffect(() => {
    // Update immediately to avoid UI lag while async tokenizer is running.
    setNum((input || '').length);

    startTransition(() => {
      debouncedEncode(input || '');
    });

    return () => {
      debouncedEncode.cancel();
    };
  }, [input, debouncedEncode]);

  return value;
};

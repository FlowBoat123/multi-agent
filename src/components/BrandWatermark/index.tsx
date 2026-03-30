'use client';

import { createStyles } from 'antd-style';
import { memo } from 'react';
import { Flexbox, FlexboxProps } from 'react-layout-kit';

const useStyles = createStyles(({ token, css }) => ({
  logoLink: css`
    line-height: 1;
    color: inherit;

    &:hover {
      color: ${token.colorLink};
    }
  `,
}));

const BrandWatermark = memo<Omit<FlexboxProps, 'children'>>(({ style, ...rest }) => {
  const { theme } = useStyles();
  return (
    <Flexbox
      align={'center'}
      dir={'ltr'}
      flex={'none'}
      gap={4}
      horizontal
      style={{ color: theme.colorTextDescription, fontSize: 12, ...style }}
      {...rest}
    >
      <span>Powered by Pham Quan</span>
    </Flexbox>
  );
});

export default BrandWatermark;
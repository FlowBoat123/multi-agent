import { getUserAuth } from '@agent/utils/server';
import { notFound } from 'next/navigation';
import { Flexbox } from 'react-layout-kit';

import { enableAuth } from '@/const/auth';
import { DESKTOP_USER_ID } from '@/const/desktop';
import FileViewer from '@/features/FileViewer';
import { createCallerFactory } from '@/libs/trpc/lambda';
import { lambdaRouter } from '@/server/routers/lambda';
import { PagePropsWithId } from '@/types/next';

import FileDetail from '../features/FileDetail';
import Header from './Header';

const createCaller = createCallerFactory(lambdaRouter);

const FilePage = async (props: PagePropsWithId) => {
  const params = await props.params;

  let userId: string | undefined;

  try {
    const auth = await getUserAuth();
    userId = auth.userId;
  } catch (error) {
    if (!enableAuth) {
      userId = DESKTOP_USER_ID;
    } else {
      throw error;
    }
  }

  if (!userId) return notFound();

  const caller = createCaller({ userId });

  const file = await caller.file.getFileItemById({ id: params.id });

  if (!file) return notFound();

  return (
    <Flexbox horizontal width={'100%'}>
      <Flexbox flex={1}>
        <Flexbox height={'100%'}>
          <Header filename={file.name} id={params.id} url={file.url} />
          <Flexbox height={'100%'} style={{ overflow: 'scroll' }}>
            <FileViewer {...file} />
          </Flexbox>
        </Flexbox>
      </Flexbox>
      <FileDetail {...file} />
    </Flexbox>
  );
};

export default FilePage;

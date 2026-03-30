'use client';

import { Button } from '@lobehub/ui';
import { UploadIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import DragUpload from '@/components/DragUpload';
import { useFileStore } from '@/store/file';

import UploadModal from './UploadModal';

const UploadFileButton = ({ knowledgeBaseId }: { knowledgeBaseId?: string }) => {
  const { t } = useTranslation('file');
  const [open, setOpen] = useState(false);

  const pushDockFileList = useFileStore((s) => s.pushDockFileList);

  return (
    <>
      <Button icon={UploadIcon} onClick={() => setOpen(true)}>
        {t('header.uploadButton')}
      </Button>

      <UploadModal knowledgeBaseId={knowledgeBaseId} onClose={() => setOpen(false)} open={open} />

      <DragUpload
        enabledFiles
        onUploadFiles={(files) => pushDockFileList(files, knowledgeBaseId)}
      />
    </>
  );
};

export default UploadFileButton;

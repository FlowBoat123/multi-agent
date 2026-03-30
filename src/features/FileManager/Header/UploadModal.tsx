'use client';

import { DEFAULT_FILE_EMBEDDING_MODEL_ITEM } from '@/const/settings/knowledge';
import { ModelItemRender, ProviderItemRender } from '@/components/ModelSelect';
import { useEnabledEmbeddingModels } from '@/hooks/useEnabledEmbeddingModels';
import { useFileStore } from '@/store/file';
import { useKnowledgeBaseStore } from '@/store/knowledgeBase';
import { EnabledProviderWithModels } from '@/types/aiProvider';
import { Button, Modal, Select, Text, type SelectProps } from '@lobehub/ui';
import { Upload } from 'antd';
import { createStyles } from 'antd-style';
import { FolderUp, Trash2Icon, UploadIcon } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

const { Dragger } = Upload;

const useStyles = createStyles(({ css, token }) => ({
  dragger: css`
    .ant-upload-drag {
      border-radius: ${token.borderRadiusLG}px;
      background: ${token.colorFillQuaternary};
    }
  `,
  fileList: css`
    overflow: auto;

    max-height: 180px;
    padding: 8px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadius}px;

    background: ${token.colorBgContainerSecondary};
  `,
}));

interface ModelOption {
  provider: string;
  value: string;
}

interface UploadModalProps {
  knowledgeBaseId?: string;
  onClose: () => void;
  open: boolean;
}

const fileKey = (file: File) =>
  [file.name, file.size, file.lastModified, (file as File & { webkitRelativePath?: string }).webkitRelativePath || ''].join('#');

const UploadModal = memo<UploadModalProps>(({ open, onClose, knowledgeBaseId }) => {
  const { t } = useTranslation('file');
  const { styles } = useStyles();

  const pushDockFileList = useFileStore((s) => s.pushDockFileList);
  const [settings, updateKnowledgeBase] = useKnowledgeBaseStore((s) => [
    knowledgeBaseId ? (s.activeKnowledgeBaseItems[knowledgeBaseId]?.settings as Record<string, any> | undefined) : undefined,
    s.updateKnowledgeBase,
  ]);
  const enabledList = useEnabledEmbeddingModels();

  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const currentEmbeddingModel =
    settings?.embeddingModel?.provider && settings?.embeddingModel?.model
      ? settings.embeddingModel
      : DEFAULT_FILE_EMBEDDING_MODEL_ITEM;

  const [selectedEmbedding, setSelectedEmbedding] = useState(currentEmbeddingModel);

  useEffect(() => {
    if (!open) return;
    setFiles([]);
    setSelectedEmbedding(currentEmbeddingModel);
  }, [open, currentEmbeddingModel.model, currentEmbeddingModel.provider]);

  const addFiles = useCallback((incoming: File[]) => {
    if (incoming.length === 0) return;
    setFiles((prev) => {
      const map = new Map(prev.map((f) => [fileKey(f), f]));
      for (const item of incoming) map.set(fileKey(item), item);
      return Array.from(map.values());
    });
  }, []);

  const modelOptions = useMemo<SelectProps['options']>(() => {
    const fallbackOption = {
      label: <ModelItemRender id={selectedEmbedding.model} showInfoTag={false} />,
      provider: selectedEmbedding.provider,
      value: `${selectedEmbedding.provider}/${selectedEmbedding.model}`,
    };

    const getEmbeddingModels = (provider: EnabledProviderWithModels) =>
      provider.children.map((model) => ({
        label: <ModelItemRender {...(model as any)} showInfoTag={false} />,
        provider: provider.id,
        value: `${provider.id}/${model.id}`,
      }));

    if (enabledList.length === 0) return [fallbackOption];

    if (enabledList.length === 1) return getEmbeddingModels(enabledList[0]);

    return enabledList.map((provider) => ({
      label: (
        <ProviderItemRender
          logo={provider.logo}
          name={provider.name}
          provider={provider.id}
          source={provider.source}
        />
      ),
      options: getEmbeddingModels(provider),
    }));
  }, [enabledList, selectedEmbedding.model, selectedEmbedding.provider]);

  const handleStartUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    try {
      if (knowledgeBaseId) {
        await updateKnowledgeBase(knowledgeBaseId, {
          settings: {
            ...(settings || {}),
            embeddingModel: selectedEmbedding,
          },
        });
      }

      await pushDockFileList(files, knowledgeBaseId);
      onClose();
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      footer={
        <Flexbox align={'center'} horizontal justify={'space-between'}>
          <Button
            icon={Trash2Icon}
            onClick={() => setFiles([])}
            disabled={files.length === 0 || uploading}
            type={'default'}
          >
            Clear
          </Button>
          <Button
            icon={UploadIcon}
            loading={uploading}
            onClick={handleStartUpload}
            disabled={files.length === 0}
            type={'primary'}
          >
            Upload {files.length > 0 ? `(${files.length})` : ''}
          </Button>
        </Flexbox>
      }
      onCancel={onClose}
      open={open}
      title={t('header.uploadButton')}
      width={680}
    >
      <Flexbox gap={12}>
        {knowledgeBaseId && (
          <Flexbox gap={6}>
            <Text size={'small'} type={'secondary'}>
              Embedding Model
            </Text>
            <Select
              onChange={(value, option) => {
                const model = value.split('/').slice(1).join('/');
                const provider = (option as unknown as ModelOption).provider;
                setSelectedEmbedding({ model, provider });
              }}
              options={modelOptions}
              popupMatchSelectWidth={false}
              value={`${selectedEmbedding.provider}/${selectedEmbedding.model}`}
            />
          </Flexbox>
        )}

        <Dragger
          beforeUpload={(file) => {
            addFiles([file]);
            return false;
          }}
          className={styles.dragger}
          multiple
          showUploadList={false}
        >
          <Flexbox align={'center'} gap={8} padding={20}>
            <Text strong>Drag and drop files here</Text>
            <Text size={'small'} type={'secondary'}>
              or choose from your computer below
            </Text>
          </Flexbox>
        </Dragger>

        <Flexbox gap={8} horizontal>
          <Upload
            beforeUpload={(file) => {
              addFiles([file]);
              return false;
            }}
            multiple
            showUploadList={false}
          >
            <Button icon={UploadIcon} type={'default'}>
              {t('header.actions.uploadFile')}
            </Button>
          </Upload>

          <Upload
            beforeUpload={(file) => {
              addFiles([file]);
              return false;
            }}
            directory
            multiple
            showUploadList={false}
          >
            <Button icon={FolderUp} type={'default'}>
              {t('header.actions.uploadFolder')}
            </Button>
          </Upload>
        </Flexbox>

        <div className={styles.fileList}>
          {files.length === 0 ? (
            <Text size={'small'} type={'secondary'}>
              No files selected yet.
            </Text>
          ) : (
            <Flexbox gap={6}>
              {files.map((file, index) => (
                <Text ellipsis key={fileKey(file)} size={'small'} type={'secondary'}>
                  {index + 1}. {file.name}
                </Text>
              ))}
            </Flexbox>
          )}
        </div>
      </Flexbox>
    </Modal>
  );
});

UploadModal.displayName = 'UploadModal';

export default UploadModal;

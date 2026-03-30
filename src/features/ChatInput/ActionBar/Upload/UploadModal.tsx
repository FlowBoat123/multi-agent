'use client';

import { validateVideoFileSize } from '@agent/utils/client';
import { Button, Modal, Text } from '@lobehub/ui';
import { Upload } from 'antd';
import { createStyles } from 'antd-style';
import { FolderUp, Trash2Icon, UploadIcon } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { message } from '@/components/AntdStaticMethods';
import { useFileStore } from '@/store/file';

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

interface UploadModalProps {
  canUploadImage: boolean;
  canUploadNonImageFiles: boolean;
  onClose: () => void;
  open: boolean;
}

const fileKey = (file: File) =>
  [
    file.name,
    file.size,
    file.lastModified,
    (file as File & { webkitRelativePath?: string }).webkitRelativePath || '',
  ].join('#');

const UploadModal = memo<UploadModalProps>(
  ({ open, onClose, canUploadImage, canUploadNonImageFiles }) => {
    const { t } = useTranslation('chat');
    const { styles } = useStyles();
    const uploadChatFiles = useFileStore((s) => s.uploadChatFiles);

    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);

    const addFiles = useCallback((incoming: File[]) => {
      if (incoming.length === 0) return;
      setFiles((prev) => {
        const map = new Map(prev.map((f) => [fileKey(f), f]));
        for (const item of incoming) map.set(fileKey(item), item);
        return Array.from(map.values());
      });
    }, []);

    const validatedFiles = useMemo(() => {
      return files.filter((file) => {
        if (!canUploadNonImageFiles && !file.type.startsWith('image')) return false;
        if (!canUploadImage && (file.type.startsWith('image') || file.type.startsWith('video')))
          return false;

        const validation = validateVideoFileSize(file);
        return validation.isValid;
      });
    }, [files, canUploadImage, canUploadNonImageFiles]);

    const handleStartUpload = async () => {
      if (validatedFiles.length === 0) return;

      setUploading(true);
      try {
        const invalidVideo = files.find((file) => !validateVideoFileSize(file).isValid);
        if (invalidVideo) {
          const validation = validateVideoFileSize(invalidVideo);
          message.error(
            t('upload.validation.videoSizeExceeded', {
              actualSize: validation.actualSize,
            }),
          );
          return;
        }

        if (!canUploadNonImageFiles && validatedFiles.some((f) => !f.type.startsWith('image'))) {
          message.warning(t('upload.clientMode.fileNotSupported'));
          return;
        }

        await uploadChatFiles(validatedFiles);
        setFiles([]);
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
              disabled={files.length === 0 || uploading}
              icon={Trash2Icon}
              onClick={() => setFiles([])}
              type={'default'}
            >
              Clear
            </Button>
            <Button
              disabled={validatedFiles.length === 0}
              icon={UploadIcon}
              loading={uploading}
              onClick={handleStartUpload}
              type={'primary'}
            >
              Upload {validatedFiles.length > 0 ? `(${validatedFiles.length})` : ''}
            </Button>
          </Flexbox>
        }
        onCancel={onClose}
        open={open}
        title={t('upload.action.fileUpload')}
        width={680}
      >
        <Flexbox gap={12}>
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
                {t('upload.action.fileUpload')}
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
                {t('upload.action.folderUpload')}
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
                {files.map((file, index) => {
                  const isAllowed = validatedFiles.some((v) => fileKey(v) === fileKey(file));
                  return (
                    <Text
                      ellipsis
                      key={fileKey(file)}
                      size={'small'}
                      type={isAllowed ? 'secondary' : 'danger'}
                    >
                      {index + 1}. {file.name}
                    </Text>
                  );
                })}
              </Flexbox>
            )}
          </div>
        </Flexbox>
      </Modal>
    );
  },
);

UploadModal.displayName = 'ChatUploadModal';

export default UploadModal;

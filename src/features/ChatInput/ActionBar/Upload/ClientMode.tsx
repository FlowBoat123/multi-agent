import { ActionIcon } from '@lobehub/ui';
import { FileUp, LucideImage } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useModelSupportFiles } from '@/hooks/useModelSupportFiles';
import { useModelSupportVision } from '@/hooks/useModelSupportVision';
import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/slices/chat';

import UploadModal from './UploadModal';

const FileUpload = memo(() => {
  const { t } = useTranslation('chat');
  const [openUploadModal, setOpenUploadModal] = useState(false);

  const model = useAgentStore(agentSelectors.currentAgentModel);
  const provider = useAgentStore(agentSelectors.currentAgentModelProvider);

  const enabledFiles = useModelSupportFiles(model, provider);
  const supportVision = useModelSupportVision(model, provider);
  const canUpload = enabledFiles || supportVision;

  return (
    <>
      <ActionIcon
        disabled={!canUpload}
        icon={enabledFiles ? FileUp : LucideImage}
        onClick={() => setOpenUploadModal(true)}
        title={t(
          canUpload
            ? enabledFiles
              ? 'upload.clientMode.actionFiletip'
              : 'upload.clientMode.actionTooltip'
            : 'upload.clientMode.disabled',
        )}
        tooltipProps={{
          placement: 'bottom',
        }}
      />

      <UploadModal
        canUploadImage={supportVision}
        canUploadNonImageFiles={enabledFiles}
        onClose={() => setOpenUploadModal(false)}
        open={openUploadModal}
      />
    </>
  );
});

export default FileUpload;

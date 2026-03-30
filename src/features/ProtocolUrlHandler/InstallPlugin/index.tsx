'use client';

import { memo } from 'react';

import CustomPluginInstallModal from './CustomPluginInstallModal';
import OfficialPluginInstallModal from './OfficialPluginInstallModal';
import { McpInstallRequest, PluginSource } from './types';

interface PluginInstallConfirmModalProps {
  installRequest: McpInstallRequest | null;
  onComplete: () => void;
}

const getPluginSource = (request: McpInstallRequest): PluginSource => {
  const { marketId } = request;

  if (marketId === 'lobehub') {
    return PluginSource.OFFICIAL;
  }

  if (marketId && marketId !== 'lobehub') {
    return PluginSource.MARKETPLACE;
  }

  return PluginSource.CUSTOM;
};

const PluginInstallConfirmModal = memo<PluginInstallConfirmModalProps>(
  ({ installRequest, onComplete }) => {
    if (!installRequest) return null;

    const pluginSource = getPluginSource(installRequest);

    if (pluginSource === PluginSource.OFFICIAL)
      return <OfficialPluginInstallModal installRequest={installRequest} onComplete={onComplete} />;

    return (
      <CustomPluginInstallModal
        installRequest={installRequest}
        isMarketplace={pluginSource === PluginSource.MARKETPLACE}
        onComplete={onComplete}
      />
    );
  },
);

PluginInstallConfirmModal.displayName = 'PluginInstallConfirmModal';

export default PluginInstallConfirmModal;

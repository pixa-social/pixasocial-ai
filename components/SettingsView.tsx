import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Tabs, Tab } from './ui/Tabs'; // Added Tabs import
import { 
    ExclamationTriangleIcon, LinkIcon, PlusCircleIcon, TrashIcon, UserCircleIcon, 
    KeyIcon, WalletIcon, UserGroupIcon, EnvelopeIcon, CheckCircleIcon,
    ArrowDownTrayIcon, ArrowUpTrayIcon, ServerStackIcon, UsersIcon as TeamIcon, WrenchScrewdriverIcon
} from './ui/Icons';
import { SOCIAL_PLATFORMS_TO_CONNECT, MAX_TEAM_MEMBERS, LOCAL_STORAGE_AI_CONFIG_KEY } from '../constants';
import { SocialPlatformType, ConnectedAccount, User, CampaignData, AiProviderConfig } from '../types';
import { useToast } from './ui/ToastProvider';
import { downloadJsonFile } from '../utils/fileUtils';
import { useForm, Controller } from 'react-hook-form'; 
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface SettingsViewProps {
  currentUser: User;
  onUpdateUser: (updatedUserData: Partial<User>) => void;
  connectedAccounts: ConnectedAccount[];
  onAddConnectedAccount: (account: ConnectedAccount) => void;
  onRemoveConnectedAccount: (platform: SocialPlatformType) => void;
  campaignData: CampaignData;
  onImportCampaignData: (data: CampaignData) => void;
}

interface ConnectModalProps {
  platform: typeof SOCIAL_PLATFORMS_TO_CONNECT[0];
  onClose: () => void;
  onConnect: (platform: SocialPlatformType, accountId: string, displayName: string, profileImageUrl?: string) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info', duration?: number) => void;
}

const userProfileSchema = z.object({
  walletAddress: z.string().optional(), 
});
type UserProfileFormData = z.infer<typeof userProfileSchema>;

const teamInviteSchema = z.object({
  teamMemberEmail: z.string().email("Invalid email address").min(1, "Email is required"),
});
type TeamInviteFormData = z.infer<typeof teamInviteSchema>;


const ConnectModalComponent: React.FC<ConnectModalProps> = ({ platform, onClose, onConnect, showToast }) => {
  const [accountId, setAccountId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');

  const handleSubmit = useCallback(() => {
    if (!accountId.trim() || !displayName.trim()) {
      showToast('Mock Account ID/Username and Display Name are required.', 'error');
      return;
    }
    onConnect(platform.id, accountId, displayName, profileImageUrl);
    onClose(); 
  }, [accountId, displayName, profileImageUrl, platform.id, onConnect, onClose, showToast]);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <Card title={`Connect to ${platform.name}`} className="w-full max-w-md bg-card shadow-xl">
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">
            <strong>This is a simulated connection.</strong> Enter mock details below.
          </p>
        </div>
        <Input
          label={`Mock ${platform.name} Account ID / Username`}
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          placeholder={`e.g., your_${platform.name.toLowerCase()}_username`}
          required
          aria-required="true"
        />
        <Input
          label={`Mock ${platform.name} Display Name`}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={`e.g., Your ${platform.name} Name`}
          required
          aria-required="true"
        />
        <Input
          label={`Mock Profile Image URL (Optional)`}
          type="url"
          value={profileImageUrl}
          onChange={(e) => setProfileImageUrl(e.target.value)}
          placeholder="https://example.com/image.png"
        />
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-lightBorder">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>Simulate Connection</Button>
        </div>
      </Card>
    </div>
  );
};
const ConnectModal = React.memo(ConnectModalComponent);

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  currentUser, onUpdateUser,
  connectedAccounts, onAddConnectedAccount, onRemoveConnectedAccount,
  campaignData, onImportCampaignData
}) => {
  const { showToast } = useToast();
  const [platformToConnect, setPlatformToConnect] = useState<typeof SOCIAL_PLATFORMS_TO_CONNECT[0] | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  
  const { register: registerProfile, handleSubmit: handleSubmitProfile, formState: { errors: profileErrors }, reset: resetProfileForm } = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
        walletAddress: currentUser.walletAddress || ''
    }
  });

  const { register: registerInvite, handleSubmit: handleSubmitInvite, formState: { errors: inviteErrors }, reset: resetInviteForm } = useForm<TeamInviteFormData>({
    resolver: zodResolver(teamInviteSchema),
  });

  useEffect(() => {
    resetProfileForm({ walletAddress: currentUser.walletAddress || '' });
  }, [currentUser.walletAddress, resetProfileForm]);

  const handleSaveUserProfile = useCallback((data: UserProfileFormData) => {
    onUpdateUser({ walletAddress: data.walletAddress });
  }, [onUpdateUser]);

  const handleMockPasswordReset = useCallback(() => {
    showToast(`Password reset instructions would be sent to ${currentUser.email}. (This is a mock action)`, 'info');
  }, [currentUser.email, showToast]);

  const handleInviteTeamMember = useCallback((data: TeamInviteFormData) => {
    const currentTeam = currentUser.teamMembers || [];
    if (currentTeam.length >= MAX_TEAM_MEMBERS) {
      showToast(`You can invite a maximum of ${MAX_TEAM_MEMBERS} team members.`, 'error');
      return;
    }
    if (currentTeam.includes(data.teamMemberEmail.trim())) {
      showToast("This email is already in your team.", 'info');
      return;
    }
    const updatedTeam = [...currentTeam, data.teamMemberEmail.trim()];
    onUpdateUser({ teamMembers: updatedTeam });
    showToast(`Invitation mock-sent to ${data.teamMemberEmail.trim()}. They've been added to your team list.`, 'success');
    resetInviteForm();
  }, [currentUser.teamMembers, onUpdateUser, showToast, resetInviteForm]);

  const handleRemoveTeamMember = useCallback((emailToRemove: string) => {
    const updatedTeam = (currentUser.teamMembers || []).filter(email => email !== emailToRemove);
    onUpdateUser({ teamMembers: updatedTeam });
    showToast(`${emailToRemove} has been removed from your team.`, 'info');
  }, [currentUser.teamMembers, onUpdateUser, showToast]);

  const handleConnectAccount = useCallback((platform: SocialPlatformType, accountId: string, displayName: string, profileImageUrl?: string) => {
    const newAccount: ConnectedAccount = {
      platform, accountId, displayName,
      profileImageUrl: profileImageUrl || undefined,
      connectedAt: new Date().toISOString(),
    };
    onAddConnectedAccount(newAccount);
  }, [onAddConnectedAccount]);

  const handleDisconnectAccount = useCallback((platform: SocialPlatformType) => {
    onRemoveConnectedAccount(platform);
  }, [onRemoveConnectedAccount]);

  const getConnectedAccount = useCallback((platformType: SocialPlatformType): ConnectedAccount | undefined => {
    return connectedAccounts.find(acc => acc.platform === platformType);
  }, [connectedAccounts]);

  const handleExportData = useCallback(() => {
    try {
      const storedAiConfigsRaw = localStorage.getItem(LOCAL_STORAGE_AI_CONFIG_KEY);
      let aiProviderConfigsForExport: Partial<AiProviderConfig>[] = [];
      if (storedAiConfigsRaw) {
        const storedAiConfigs: AiProviderConfig[] = JSON.parse(storedAiConfigsRaw);
        aiProviderConfigsForExport = storedAiConfigs.map(config => {
          const { apiKey, ...rest } = config; // eslint-disable-line @typescript-eslint/no-unused-vars
          return rest;
        });
      }
      const dataToExport = { ...campaignData, aiProviderConfigs: aiProviderConfigsForExport, chatMessages: [] };
      const filename = `pixasocial_campaign_data_${new Date().toISOString().split('T')[0]}.json`;
      downloadJsonFile(dataToExport, filename);
      showToast("Campaign data exported successfully!", "success");
    } catch (error) {
      console.error("Error exporting data:", error);
      showToast(`Failed to export data: ${(error as Error).message}`, "error");
    }
  }, [campaignData, showToast]);

  const handleImportFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedContent = e.target?.result;
          if (typeof importedContent === 'string') {
            const parsedData = JSON.parse(importedContent) as CampaignData;
             if (window.confirm("Are you sure you want to import this data? This will replace your current campaign data.")) {
                onImportCampaignData(parsedData);
             }
          } else { throw new Error("Failed to read file content as text."); }
        } catch (error) {
          console.error("Error parsing imported JSON:", error);
          showToast(`Failed to parse JSON: ${(error as Error).message}`, "error");
        } finally { if (importFileRef.current) { importFileRef.current.value = ""; } }
      };
      reader.onerror = () => {
        showToast("Failed to read the selected file.", "error");
        if (importFileRef.current) { importFileRef.current.value = ""; }
      };
      reader.readAsText(file);
    }
  }, [onImportCampaignData, showToast]);

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-textPrimary mb-6">Settings</h2>
        <Card className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-3 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-700">Simulation Notice</h3>
              <p className="text-yellow-600 text-sm">
                User profile changes, team management, and account connections are <strong>simulated</strong> and use local storage.
                Data import/export also operates on local browser data.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs tabListClassName="border-gray-300" tabButtonClassName="hover:border-gray-400 text-gray-600" activeTabButtonClassName="border-primary text-primary">
        <Tab label="User Profile" icon={<UserCircleIcon className="w-5 h-5" />}>
            <Card title="Your Profile" shadow="soft-lg" className="mt-4">
                <form onSubmit={handleSubmitProfile(handleSaveUserProfile)} className="space-y-4">
                <Input label="Username (Display Name)" value={currentUser.name || 'N/A'} readOnly disabled containerClassName="opacity-70"/>
                <Input label="Email Address" value={currentUser.email} readOnly disabled containerClassName="opacity-70"/>
                <div>
                    <label className="block text-sm font-medium text-textSecondary mb-1">Password</label>
                    <div className="flex items-center space-x-3">
                    <Input type="password" value="••••••••" readOnly disabled containerClassName="mb-0 flex-grow opacity-70"/>
                    <Button type="button" variant="secondary" size="sm" onClick={handleMockPasswordReset} leftIcon={<KeyIcon className="w-4 h-4"/>} className="mt-1" title="Reset Password">Reset Password</Button>
                    </div>
                </div>
                <Input
                    label="Crypto Wallet Address (Optional)"
                    {...registerProfile("walletAddress")}
                    error={profileErrors.walletAddress?.message}
                    aria-invalid={!!profileErrors.walletAddress}
                    placeholder="e.g., 0x..."
                    leftIcon={<WalletIcon className="w-5 h-5 text-gray-400"/>}
                />
                <Button type="submit" variant="primary" leftIcon={<CheckCircleIcon className="w-5 h-5"/>}>Save Profile Changes</Button>
                </form>
            </Card>
        </Tab>
        <Tab label="Team Management" icon={<TeamIcon className="w-5 h-5" />}>
            <Card title="Manage Your Team" shadow="soft-lg" className="mt-4">
                <form onSubmit={handleSubmitInvite(handleInviteTeamMember)} className="space-y-4">
                <Input
                    label="Invite Team Member (Enter Email)"
                    type="email"
                    {...registerInvite("teamMemberEmail")}
                    error={inviteErrors.teamMemberEmail?.message}
                    aria-invalid={!!inviteErrors.teamMemberEmail}
                    placeholder="teammate@example.com"
                    leftIcon={<EnvelopeIcon className="w-5 h-5 text-gray-400"/>}
                />
                <Button 
                    type="submit"
                    variant="primary" 
                    disabled={(currentUser.teamMembers?.length || 0) >= MAX_TEAM_MEMBERS}
                    leftIcon={<UserGroupIcon className="w-5 h-5"/>}
                >
                    Invite Team Member
                </Button>
                </form>
                {(currentUser.teamMembers?.length || 0) >= MAX_TEAM_MEMBERS && (
                <p className="text-xs text-danger mt-2">Maximum team size of {MAX_TEAM_MEMBERS} reached.</p>
                )}
                {currentUser.teamMembers && currentUser.teamMembers.length > 0 && (
                <div className="mt-4">
                    <h4 className="text-sm font-medium text-textSecondary mb-2">Current Team Members ({currentUser.teamMembers.length}/{MAX_TEAM_MEMBERS}):</h4>
                    <ul className="space-y-2">
                    {currentUser.teamMembers.map(email => (
                        <li key={email} className="flex justify-between items-center p-2 bg-gray-100 rounded-md">
                        <span className="text-sm text-textPrimary">{email}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveTeamMember(email)} className="text-danger hover:bg-red-100 px-2 py-1" title={`Remove ${email} from team`}>
                            <TrashIcon className="w-4 h-4"/>
                        </Button>
                        </li>
                    ))}
                    </ul>
                </div>
                )}
                {(currentUser.teamMembers?.length || 0) === 0 && ( <p className="text-sm text-textSecondary mt-2">No team members invited yet.</p> )}
            </Card>
        </Tab>
        <Tab label="Social Accounts" icon={<LinkIcon className="w-5 h-5" />}>
            <Card title="Connected Social Accounts" shadow="soft-lg" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {SOCIAL_PLATFORMS_TO_CONNECT.map((platform) => {
                    const connectedAccount = getConnectedAccount(platform.id);
                    const PlatformIcon = platform.icon || LinkIcon;
                    return (
                    <Card key={platform.id} className="flex flex-col justify-between" shadow="soft-md">
                        <div>
                        <div className="flex items-center mb-3">
                            <PlatformIcon className={`w-8 h-8 mr-3 ${platform.brandColor || 'text-textSecondary'}`} />
                            <h3 className="text-xl font-semibold text-textPrimary">{platform.name}</h3>
                        </div>
                        <p className="text-sm text-textSecondary mb-4 min-h-[40px]">{platform.description}</p>
                        {connectedAccount ? (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                            <div className="flex items-center mb-2">
                                {connectedAccount.profileImageUrl ? (
                                <img src={connectedAccount.profileImageUrl} alt={connectedAccount.displayName} className="w-10 h-10 rounded-full mr-3 border border-gray-300 object-cover" />
                                ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-lg font-medium mr-3">
                                    {connectedAccount.displayName.substring(0,1).toUpperCase()}
                                </div>
                                )}
                                <div>
                                <p className="text-sm font-semibold text-green-700">Connected: {connectedAccount.displayName}</p>
                                <p className="text-xs text-green-600">Account ID: {connectedAccount.accountId}</p>
                                <p className="text-xs text-gray-500">Connected: {new Date(connectedAccount.connectedAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <Button variant="danger" size="sm" onClick={() => handleDisconnectAccount(platform.id)} leftIcon={<TrashIcon className="w-4 h-4"/>} className="w-full mt-2" title={`Disconnect ${platform.name}`}>
                                Disconnect
                            </Button>
                            </div>
                        ) : (
                            <Button variant="secondary" onClick={() => setPlatformToConnect(platform)} leftIcon={<PlusCircleIcon className="w-5 h-5"/>} className="w-full" title={`Connect ${platform.name}`}>
                            Connect {platform.name}
                            </Button>
                        )}
                        </div>
                    </Card>
                    );
                })}
                </div>
            </Card>
        </Tab>
        <Tab label="Data Management" icon={<ServerStackIcon className="w-5 h-5" />}>
            <Card title="Manage Campaign Data" shadow="soft-lg" className="mt-4">
                <div className="space-y-4">
                <div>
                    <h4 className="text-md font-semibold text-textPrimary mb-2">Export Campaign Data</h4>
                    <p className="text-sm text-textSecondary mb-3">
                    Download all your personas, operators, content drafts, scheduled posts, content library assets, and AI configurations (API keys excluded for security) as a single JSON file.
                    </p>
                    <Button variant="secondary" onClick={handleExportData} leftIcon={<ArrowDownTrayIcon className="w-5 h-5"/>}>
                    Export All Campaign Data
                    </Button>
                </div>
                <hr className="my-6 border-lightBorder"/>
                <div>
                    <h4 className="text-md font-semibold text-textPrimary mb-2">Import Campaign Data</h4>
                    <p className="text-sm text-textSecondary mb-1">Import campaign data from a previously exported JSON file.</p>
                    <p className="text-sm text-danger font-medium mb-3">Warning: This will replace all your current campaign data.</p>
                    <input type="file" accept=".json" onChange={handleImportFileChange} className="hidden" ref={importFileRef} id="import-campaign-data-input"/>
                    <Button variant="danger" onClick={() => importFileRef.current?.click()} leftIcon={<ArrowUpTrayIcon className="w-5 h-5"/>}>
                    Import & Replace Data
                    </Button>
                </div>
                </div>
            </Card>
        </Tab>
      </Tabs>


      {platformToConnect && (
        <ConnectModal platform={platformToConnect} onClose={() => setPlatformToConnect(null)} onConnect={handleConnectAccount} showToast={showToast}/>
      )}
    </div>
  );
};
// Assuming WrenchScrewdriverIcon is for general settings or admin, not directly used in this tab structure
// UserCircleIcon, LinkIcon, TeamIcon, ServerStackIcon are used as tab icons.

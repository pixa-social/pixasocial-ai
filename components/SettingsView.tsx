
import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { 
    ExclamationTriangleIcon, LinkIcon, PlusCircleIcon, TrashIcon, UserCircleIcon, 
    KeyIcon, WalletIcon, UserGroupIcon, EnvelopeIcon, CheckCircleIcon 
} from './ui/Icons';
import { SOCIAL_PLATFORMS_TO_CONNECT, MAX_TEAM_MEMBERS } from '../constants';
import { SocialPlatformType, ConnectedAccount, User } from '../types';
import { useToast } from './ui/ToastProvider';

interface SettingsViewProps {
  currentUser: User;
  onUpdateUser: (updatedUserData: Partial<User>) => void;
  connectedAccounts: ConnectedAccount[];
  onAddConnectedAccount: (account: ConnectedAccount) => void;
  onRemoveConnectedAccount: (platform: SocialPlatformType) => void;
}

interface ConnectModalProps {
  platform: typeof SOCIAL_PLATFORMS_TO_CONNECT[0];
  onClose: () => void;
  onConnect: (platform: SocialPlatformType, accountId: string, displayName: string, profileImageUrl?: string) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info', duration?: number) => void;
}

const ConnectModal: React.FC<ConnectModalProps> = ({ platform, onClose, onConnect, showToast }) => {
  const [accountId, setAccountId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');

  const handleSubmit = () => {
    if (!accountId.trim() || !displayName.trim()) {
      showToast('Mock Account ID/Username and Display Name are required.', 'error');
      return;
    }
    onConnect(platform.id, accountId, displayName, profileImageUrl);
    onClose(); 
  };

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
        />
        <Input
          label={`Mock ${platform.name} Display Name`}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={`e.g., Your ${platform.name} Name`}
          required
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

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  currentUser, onUpdateUser,
  connectedAccounts, onAddConnectedAccount, onRemoveConnectedAccount 
}) => {
  const { showToast } = useToast();
  const [platformToConnect, setPlatformToConnect] = useState<typeof SOCIAL_PLATFORMS_TO_CONNECT[0] | null>(null);
  
  // State for User Profile
  const [walletAddressInput, setWalletAddressInput] = useState(currentUser.walletAddress || '');
  
  // State for Team Management
  const [teamMemberEmailInput, setTeamMemberEmailInput] = useState('');

  useEffect(() => {
    setWalletAddressInput(currentUser.walletAddress || '');
  }, [currentUser.walletAddress]);

  const handleSaveUserProfile = () => {
    onUpdateUser({ walletAddress: walletAddressInput });
    // Toast for success is handled by onUpdateUser in App.tsx
  };

  const handleMockPasswordReset = () => {
    showToast(`Password reset instructions would be sent to ${currentUser.email}. (This is a mock action)`, 'info');
  };

  const handleInviteTeamMember = () => {
    if (!teamMemberEmailInput.trim() || !/^\S+@\S+\.\S+$/.test(teamMemberEmailInput.trim())) {
      showToast("Please enter a valid email address to invite.", 'error');
      return;
    }
    const currentTeam = currentUser.teamMembers || [];
    if (currentTeam.length >= MAX_TEAM_MEMBERS) {
      showToast(`You can invite a maximum of ${MAX_TEAM_MEMBERS} team members.`, 'error');
      return;
    }
    if (currentTeam.includes(teamMemberEmailInput.trim())) {
      showToast("This email is already in your team.", 'info');
      return;
    }
    const updatedTeam = [...currentTeam, teamMemberEmailInput.trim()];
    onUpdateUser({ teamMembers: updatedTeam });
    showToast(`Invitation mock-sent to ${teamMemberEmailInput.trim()}. They've been added to your team list.`, 'success');
    setTeamMemberEmailInput('');
  };

  const handleRemoveTeamMember = (emailToRemove: string) => {
    const updatedTeam = (currentUser.teamMembers || []).filter(email => email !== emailToRemove);
    onUpdateUser({ teamMembers: updatedTeam });
    showToast(`${emailToRemove} has been removed from your team.`, 'info');
  };

  const handleConnectAccount = (platform: SocialPlatformType, accountId: string, displayName: string, profileImageUrl?: string) => {
    const newAccount: ConnectedAccount = {
      platform,
      accountId,
      displayName,
      profileImageUrl: profileImageUrl || undefined,
      connectedAt: new Date().toISOString(),
    };
    onAddConnectedAccount(newAccount);
  };

  const handleDisconnectAccount = (platform: SocialPlatformType) => {
    onRemoveConnectedAccount(platform);
  }

  const getConnectedAccount = (platformType: SocialPlatformType): ConnectedAccount | undefined => {
    return connectedAccounts.find(acc => acc.platform === platformType);
  };

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
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* User Profile Section */}
      <Card title="User Profile" shadow="soft-lg">
        <div className="space-y-4">
          <Input label="Username (Display Name)" value={currentUser.name || 'N/A'} readOnly disabled containerClassName="opacity-70"/>
          <Input label="Email Address" value={currentUser.email} readOnly disabled containerClassName="opacity-70"/>
          
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-1">Password</label>
            <div className="flex items-center space-x-3">
              <Input type="password" value="••••••••" readOnly disabled containerClassName="mb-0 flex-grow opacity-70"/>
              <Button variant="secondary" size="sm" onClick={handleMockPasswordReset} leftIcon={<KeyIcon className="w-4 h-4"/>} className="mt-1">Reset Password</Button>
            </div>
          </div>

          <Input
            label="Crypto Wallet Address (Optional)"
            value={walletAddressInput}
            onChange={(e) => setWalletAddressInput(e.target.value)}
            placeholder="e.g., 0x..."
            leftIcon={<WalletIcon className="w-5 h-5 text-gray-400"/>}
          />
          <Button variant="primary" onClick={handleSaveUserProfile} leftIcon={<CheckCircleIcon className="w-5 h-5"/>}>Save Profile Changes</Button>
        </div>
      </Card>

      {/* Team Management Section */}
      <Card title="Team Management" shadow="soft-lg">
        <div className="space-y-4">
          <Input
            label="Invite Team Member (Enter Email)"
            type="email"
            value={teamMemberEmailInput}
            onChange={(e) => setTeamMemberEmailInput(e.target.value)}
            placeholder="teammate@example.com"
            leftIcon={<EnvelopeIcon className="w-5 h-5 text-gray-400"/>}
          />
          <Button 
            variant="primary" 
            onClick={handleInviteTeamMember} 
            disabled={(currentUser.teamMembers?.length || 0) >= MAX_TEAM_MEMBERS}
            leftIcon={<UserGroupIcon className="w-5 h-5"/>}
          >
            Invite Team Member
          </Button>
          {(currentUser.teamMembers?.length || 0) >= MAX_TEAM_MEMBERS && (
            <p className="text-xs text-danger">Maximum team size of {MAX_TEAM_MEMBERS} reached.</p>
          )}

          {currentUser.teamMembers && currentUser.teamMembers.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-textSecondary mb-2">
                Current Team Members ({currentUser.teamMembers.length}/{MAX_TEAM_MEMBERS}):
              </h4>
              <ul className="space-y-2">
                {currentUser.teamMembers.map(email => (
                  <li key={email} className="flex justify-between items-center p-2 bg-gray-100 rounded-md">
                    <span className="text-sm text-textPrimary">{email}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveTeamMember(email)} className="text-danger hover:bg-red-100 px-2 py-1">
                      <TrashIcon className="w-4 h-4"/>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
           {(currentUser.teamMembers?.length || 0) === 0 && (
             <p className="text-sm text-textSecondary">No team members invited yet.</p>
           )}
        </div>
      </Card>

      {/* Connected Accounts Section */}
      <Card title="Connected Social Accounts" shadow="soft-lg">
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
                      <Button 
                          variant="danger" 
                          size="sm" 
                          onClick={() => handleDisconnectAccount(platform.id)}
                          leftIcon={<TrashIcon className="w-4 h-4"/>}
                          className="w-full mt-2"
                        >
                          Disconnect
                        </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="secondary" // Changed to secondary to distinguish from profile/team primary
                      onClick={() => setPlatformToConnect(platform)}
                      leftIcon={<PlusCircleIcon className="w-5 h-5"/>}
                      className="w-full"
                    >
                      Connect {platform.name}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      {platformToConnect && (
        <ConnectModal
          platform={platformToConnect}
          onClose={() => setPlatformToConnect(null)}
          onConnect={handleConnectAccount}
          showToast={showToast}
        />
      )}
    </div>
  );
};
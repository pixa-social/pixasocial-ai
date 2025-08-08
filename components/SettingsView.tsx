import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Tabs, Tab } from './ui/Tabs';
import { 
    ExclamationTriangleIcon, LinkIcon, PlusCircleIcon, TrashIcon, UserCircleIcon, 
    KeyIcon, WalletIcon, UserGroupIcon, EnvelopeIcon, CheckCircleIcon,
    PaperAirplaneIcon
} from './ui/Icons';
import { SOCIAL_PLATFORMS_TO_CONNECT, MAX_TEAM_MEMBERS } from '../constants';
import { SocialPlatformType, ConnectedAccount, UserProfile, SocialPlatformConnectionDetails, RoleName, User } from '../types';
import { useToast } from './ui/ToastProvider';
import { useForm } from 'react-hook-form'; 
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ConnectionFlowModal } from './settings/ConnectionFlowModal';
import { supabase } from '../services/supabaseClient';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { useAppDataContext } from './MainAppLayout';

const userProfileSchema = z.object({
  walletAddress: z.string().optional(), 
});
type UserProfileFormData = z.infer<typeof userProfileSchema>;

const teamInviteSchema = z.object({
  teamMemberEmail: z.string().email("Invalid email address").min(1, "Email is required"),
});
type TeamInviteFormData = z.infer<typeof teamInviteSchema>;


export const SettingsView: React.FC = () => { 
  const { currentUser, onUpdateUser, connectedAccounts, handlers, fetchers } = useAppDataContext();
  const { addConnectedAccount: onAddConnectedAccount, deleteConnectedAccount: onDeleteConnectedAccount } = handlers;
  const { fetchConnectedAccounts: onAccountConnectOrDelete } = fetchers;
  
  const { showToast } = useToast();
  const [platformToConnect, setPlatformToConnect] = useState<SocialPlatformConnectionDetails | null>(null);
  const [isHandlingCallback, setIsHandlingCallback] = useState(false);
  
  // State for Telegram Connection Form
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChannelId, setTelegramChannelId] = useState('');
  const [isConnectingTelegram, setIsConnectingTelegram] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const { register: registerProfile, handleSubmit: handleSubmitProfile, formState: { errors: profileErrors }, reset: resetProfileForm } = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
        walletAddress: currentUser.walletAddress || ''
    }
  });

  const { register: registerInvite, handleSubmit: handleSubmitInvite, formState: { errors: inviteErrors }, reset: resetInviteForm } = useForm<TeamInviteFormData>({
    resolver: zodResolver(teamInviteSchema),
  });

  const isAdmin = currentUser.role_name === RoleName.Admin;

  useEffect(() => {
    resetProfileForm({ walletAddress: currentUser.walletAddress || '' });
  }, [currentUser, resetProfileForm]);

  // Effect to handle OAuth callbacks
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');
    const connectSuccess = params.get('connect_success');

    const handleRedditCallback = async (authCode: string, authState: string) => {
        setIsHandlingCallback(true);
        showToast('Finalizing Reddit connection...', 'info');
        try {
            const { error: funcError } = await supabase.functions.invoke('connect-reddit-callback', {
                body: { code: authCode, state: authState }
            });

            if (funcError) {
                let detailedError = funcError.message;
                if ('context' in funcError && funcError.context && typeof funcError.context.responseText === 'string') {
                    try { const parsed = JSON.parse(funcError.context.responseText); if (parsed.error) detailedError = parsed.error; } catch(e) { /* ignore */ }
                }
                throw new Error(detailedError);
            }
            showToast('Successfully connected to Reddit! Refreshing accounts...', 'success');
            onAccountConnectOrDelete();
        } catch (e) {
            showToast(`Connection failed: ${(e as Error).message}`, 'error');
        } finally {
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
            setIsHandlingCallback(false);
        }
    };

    if (code && state) {
      handleRedditCallback(code, state);
    } else if (error) {
      showToast(`Connection failed: ${error}`, 'error');
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    } else if (connectSuccess) {
      showToast(`Successfully connected to ${connectSuccess}! Refreshing...`, 'success');
      onAccountConnectOrDelete();
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [showToast, onAccountConnectOrDelete]);


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

  const getConnectedAccount = useCallback((platformType: SocialPlatformType): ConnectedAccount | undefined => {
    return connectedAccounts.find(acc => acc.platform === platformType);
  }, [connectedAccounts]);

  const handleConnectPlatform = useCallback(async (platform: SocialPlatformType, connectionType: string) => {
      let functionName: string | null = null;
      switch (platform) {
          case SocialPlatformType.Reddit:
              functionName = 'connect-reddit';
              break;
          case SocialPlatformType.GoogleBusiness:
              functionName = 'connect-google-business';
              break;
          case SocialPlatformType.Facebook:
              functionName = 'connect-facebook';
              break;
          case SocialPlatformType.X:
              functionName = 'connect-twitter';
              break;
          default:
              // Fallback for simulated connections
              const displayName = `${currentUser.name}'s ${connectionType} ${platform}`;
              const accountId = `${platform.toLowerCase()}-${currentUser.id.substring(0,8)}`;
              onAddConnectedAccount(platform, accountId, displayName);
              setPlatformToConnect(null);
              return;
      }

      if (functionName) {
          try {
              const { data, error } = await supabase.functions.invoke(functionName);
              if (error) throw error;
              if (data.redirectUrl) {
                  window.location.href = data.redirectUrl;
              } else {
                  throw new Error("No redirect URL returned from function.");
              }
          } catch(error) {
              showToast(`Could not start ${platform} connection: ${(error as Error).message}`, 'error');
          }
      }
      setPlatformToConnect(null);
  }, [currentUser, onAddConnectedAccount, showToast]);
  
  const handleConnectTelegram = async (isForAdmin: boolean) => {
    if (!telegramChannelId) {
        showToast("Channel ID is required.", 'error');
        return;
    }
    if (isForAdmin && !telegramBotToken) {
        showToast("Bot Token is required for admin connection.", 'error');
        return;
    }

    setIsConnectingTelegram(true);
    const body: {
        platform: SocialPlatformType;
        displayName: string;
        channelId: string;
        botToken?: string;
    } = {
        platform: SocialPlatformType.Telegram,
        displayName: `Channel (${telegramChannelId})`,
        channelId: telegramChannelId,
    };
    if (isForAdmin) {
        body.botToken = telegramBotToken;
    }

    const { error } = await supabase.functions.invoke('connect-telegram', { body });

    if (error) {
        let errorMessage = error.message;
        if ((error as any).context && typeof (error as any).context.json === 'function') {
            try { const functionError = await (error as any).context.json(); if (functionError.error) errorMessage = functionError.error; } catch (e) {}
        }
        showToast(`Telegram connection failed: ${errorMessage}`, 'error');
    } else {
        showToast("Telegram connected successfully!", 'success');
        onAccountConnectOrDelete();
        setTelegramBotToken('');
        setTelegramChannelId('');
    }
    setIsConnectingTelegram(false);
  };

  const handleTestTelegram = async () => {
      setIsTestingConnection(true);
      const { data, error } = await supabase.functions.invoke('telegram-poster');
      
      if (error) {
          let errorMessage = error.message;
          if ((error as any).context && typeof (error as any).context.json === 'function') {
            try { const functionError = await (error as any).context.json(); if (functionError.error) errorMessage = functionError.error; } catch (e) { /* Ignore */ }
          }
          showToast(`Test failed: ${errorMessage}`, 'error');
      } else if (data.error) {
          showToast(`Test failed: ${data.error}`, 'error');
      } else {
          showToast(data.message || "Test message sent successfully!", 'success');
      }
      setIsTestingConnection(false);
  };

  if (isHandlingCallback) {
    return (
        <div className="flex items-center justify-center h-64">
            <LoadingSpinner text="Finalizing connection, please wait..." />
        </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-textPrimary mb-6">Settings</h2>
      </div>

      <Tabs tabListClassName="border-gray-700" tabButtonClassName="hover:border-gray-500 text-textSecondary" activeTabButtonClassName="border-primary text-primary">
        <Tab label="User Profile" icon={<UserCircleIcon className="w-5 h-5" />}>
            <Card title="Your Profile" className="mt-4">
                <form onSubmit={handleSubmitProfile(handleSaveUserProfile)} className="space-y-4">
                <Input label="Username (Display Name)" value={currentUser.name || 'N/A'} readOnly disabled containerClassName="opacity-70"/>
                <Input label="Email Address" value={currentUser.email || ''} readOnly disabled containerClassName="opacity-70"/>
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
        <Tab label="Team Management" icon={<UserGroupIcon className="w-5 h-5" />}>
            <Card title="Manage Your Team" className="mt-4">
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
                        <li key={email} className="flex justify-between items-center p-2 bg-white/5 rounded-md">
                        <span className="text-sm text-textPrimary">{email}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveTeamMember(email)} className="text-danger hover:bg-red-500/10 px-2 py-1" title={`Remove ${email} from team`}>
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
            <Card title="Connected Social Accounts" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {SOCIAL_PLATFORMS_TO_CONNECT.map((platform) => {
                    const connectedAccount = getConnectedAccount(platform.id);
                    const PlatformIcon = platform.icon || LinkIcon;
                    return (
                    <Card key={platform.id} className="flex flex-col justify-between">
                        <div>
                        <div className="flex items-center mb-3">
                            <PlatformIcon className={`w-8 h-8 mr-3 ${platform.brandColor || 'text-textSecondary'}`} />
                            <h3 className="text-xl font-semibold text-textPrimary">{platform.name}</h3>
                        </div>
                        <p className="text-sm text-textSecondary mb-4 min-h-[40px]">{platform.description}</p>
                        {connectedAccount ? (
                            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-md">
                                <div className="flex items-center mb-2">
                                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-gray-300 text-lg font-medium mr-3">
                                        {(connectedAccount.accountname || '?').substring(0,1).toUpperCase()}
                                    </div>
                                    <div>
                                    <p className="text-sm font-semibold text-green-300">Connected: {connectedAccount.accountname}</p>
                                    <p className="text-xs text-green-400">Account ID: {connectedAccount.accountid}</p>
                                    {connectedAccount.created_at && <p className="text-xs text-textSecondary">Connected: {format(new Date(connectedAccount.created_at), 'PP')}</p>}
                                    </div>
                                </div>
                                <div className="flex space-x-2 mt-2">
                                    {platform.id === SocialPlatformType.Telegram && (
                                        <Button variant="outline" size="sm" onClick={handleTestTelegram} isLoading={isTestingConnection} leftIcon={<PaperAirplaneIcon className="w-4 h-4"/>} className="flex-1" title="Test Connection">
                                            Test
                                        </Button>
                                    )}
                                    <Button variant="destructive" size="sm" onClick={() => onDeleteConnectedAccount(connectedAccount.id, platform.name)} leftIcon={<TrashIcon className="w-4 h-4"/>} className="flex-1" title={`Disconnect ${platform.name}`}>
                                        Disconnect
                                    </Button>
                                </div>
                            </div>
                        ) : platform.id === SocialPlatformType.Telegram ? (
                            isAdmin ? (
                                <div className="space-y-3">
                                    <Input label="Bot Token (Admin Only)" type="password" value={telegramBotToken} onChange={e => setTelegramBotToken(e.target.value)} placeholder="Enter bot token" containerClassName="mb-0"/>
                                    <Input label="Channel ID" value={telegramChannelId} onChange={e => setTelegramChannelId(e.target.value)} placeholder="Enter channel ID" containerClassName="mb-0" />
                                    <Button variant="secondary" onClick={() => handleConnectTelegram(true)} leftIcon={<PlusCircleIcon className="w-5 h-5"/>} className="w-full" title="Connect Telegram" isLoading={isConnectingTelegram}>
                                        Save & Connect
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="text-sm text-textSecondary space-y-1 p-2 bg-background rounded-md">
                                        <p>1. In Telegram, add our bot <strong className="text-primary">@pixasocial_bot</strong> as an admin to your channel.</p>
                                        <p>2. Enter your unique Channel ID below.</p>
                                    </div>
                                    <Input label="Channel ID" value={telegramChannelId} onChange={e => setTelegramChannelId(e.target.value)} placeholder="Enter your channel ID" containerClassName="mb-0" />
                                    <Button variant="secondary" onClick={() => handleConnectTelegram(false)} leftIcon={<PlusCircleIcon className="w-5 h-5"/>} className="w-full" title="Connect Telegram" isLoading={isConnectingTelegram}>
                                        Save & Connect
                                    </Button>
                                </div>
                            )
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
      </Tabs>


      {platformToConnect && (
        <ConnectionFlowModal 
            platform={platformToConnect} 
            onClose={() => setPlatformToConnect(null)} 
            onConnect={handleConnectPlatform}
        />
      )}
    </div>
  );
};

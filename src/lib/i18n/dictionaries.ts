import { DEFAULT_LOCALE } from "./locales";
import { ar } from "./translations/ar";
import { de } from "./translations/de";
import { es } from "./translations/es";
import { fr } from "./translations/fr";
import { ja } from "./translations/ja";
import { pl } from "./translations/pl";
import { uk } from "./translations/uk";
import { zhHans } from "./translations/zh-hans";

/**
 * The strings the interface is built from.
 *
 * English is the source of truth: every key exists here, and TypeScript makes a
 * translation prove its keys are real. A locale with no entry below - most of
 * the list - falls back to English key by key, so a half-finished translation
 * shows what it has and English for the rest rather than blanks.
 */
export const en = {
  // chrome
  "nav.feed": "Feed",
  "nav.discover": "Discover",
  "nav.matches": "Matches",
  "nav.messages": "Messages",
  "nav.friends": "Friends",
  "nav.groups": "Groups",
  "nav.notifications": "Notifications",
  "nav.account": "Your account",

  "menu.profile": "Profile",
  "menu.settings": "Settings",
  "menu.help": "Help",
  "menu.logout": "Log out",

  // actions
  "action.save": "Save changes",
  "action.saving": "Saving…",
  "action.cancel": "Cancel",
  "groups.banReason": "Reason (optional)",
  "confirm.handOver": "Hand the group over? You become an admin.",
  "chat.moreEmoji": "More emoji",
  "confirm.deleteMessage": "Delete this message?",
  "confirm.deletePost": "Delete this post?",
  "confirm.deleteComment": "Delete this comment?",
  "confirm.deletePhoto": "Delete this photo?",
  "confirm.upload": "Upload this photo?",
  "confirm.unmatch": "End this match?",
  "confirm.removeMember": "Remove this member?",
  "confirm.yes": "Yes, do it",
  "confirm.no": "No, keep it",
  "action.post": "Post",
  "action.posting": "Posting…",
  "action.send": "Send",
  "action.delete": "Delete",
  "action.remove": "Remove",
  "action.block": "Block",
  "action.unblock": "Unblock",
  "action.report": "Report",
  "action.follow": "Follow",
  "action.following": "Following",
  "action.message": "Message",
  "action.join": "Join",
  "action.leave": "Leave",
  "action.invite": "Invite",
  "action.invited": "Invited",
  "action.accept": "Accept",
  "action.decline": "Decline",
  "action.close": "Close",
  "action.copyLink": "Copy link",
  "action.copied": "Copied",
  "action.share": "Share",
  "action.loading": "Loading…",

  // settings
  "settings.title": "Settings",
  "settings.account": "Account",
  "settings.email": "Email",
  "settings.emailConfirmed": "Email confirmed",
  "settings.emailYes": "Yes",
  "settings.emailNo": "Not yet",
  "settings.memberSince": "Member since",
  "settings.language": "Language",
  "settings.languageHint": "The language the interface is shown in.",
  "settings.privacy": "Profile and privacy",
  "settings.editProfile": "Edit your profile",
  "settings.editProfileHint": "Photos, bio, and who you want to meet",
  "settings.blocked": "Blocked people",
  "settings.blockedNone": "Nobody blocked",
  "settings.visibility": "Visibility in Discover",
  "settings.visibilityShown": "Your profile is shown to others",
  "settings.visibilityHidden": "Your profile is hidden",
  "settings.reading": "Reading",
  "settings.terms": "Terms of service",
  "settings.termsHint": "What you agree to",
  "settings.privacyPolicy": "Privacy policy",
  "settings.privacyPolicyHint": "What we hold, and why",
  "settings.safety": "Staying safe",
  "settings.safetyHint": "Advice before you meet someone",
  "settings.blockedEmpty": "You have not blocked anyone.",
  "settings.blockedSince": "blocked",
  "settings.blockedHint":
    "Blocked people cannot see your profile, message you, or find you in Discover.",

  "danger.title": "Your data",
  "danger.body":
    "You can download everything we hold about you, or delete your account permanently.",
  "danger.confirmBody":
    "This deletes your profile, photos, matches, messages, and posts. It cannot be undone.",
  "danger.password": "Confirm with your password",
  "danger.deleting": "Deleting…",
  "danger.deletePermanently": "Delete permanently",
  "danger.failed": "Could not delete the account.",
  "danger.download": "Download my data",
  "danger.delete": "Delete my account",

  // profile
  "profile.followers": "Followers",
  "profile.followingCount": "Following",
  "profile.posts": "Posts",
  "profile.photos": "Photos",
  "profile.friends": "Friends",
  "profile.mutual": "Mutual",
  "profile.about": "About",
  "profile.noCity": "No city set",
  "profile.moderationQueue": "Open the admin area",
  "profile.followersEmpty":
    "Nobody follows you yet. Posting publicly is the fastest way to change that.",
  "profile.followingEmpty": "You are not following anyone yet.",
  "profile.settingsNote":
    "Your data, blocked people, and account deletion are in Settings.",
  "profile.noPosts": "No posts to show.",
  "profile.edit": "Edit profile",
  "profile.displayName": "Display name",
  "profile.bio": "About you",
  "profile.work": "Work",
  "profile.city": "City",
  "profile.wantToMeet": "I want to meet",
  "profile.minAge": "Min age",
  "profile.maxAge": "Max age",
  "profile.distance": "Distance (km)",
  "profile.showInDiscover": "Show my profile in Discover",
  "profile.saved": "Saved.",
  "gender.man": "Man",
  "gender.woman": "Woman",
  "gender.nonbinary": "Non-binary",
  "gender.other": "Other",
  "photos.title": "Photos",
  "photos.full": "See this photo full size",
  "photos.choose": "Choose a photo",
  "photos.change": "Change photo",
  "photos.upload": "Upload",
  "photos.uploading": "Uploading…",
  "photos.pending": "Visible · awaiting review",
  "photos.approved": "Reviewed",
  "photos.rejected": "Rejected · hidden from others",
  "photos.makeMain": "Make main",
  "photos.main": "Main",
  "photos.badType": "Only JPEG, PNG, WebP, and GIF images are allowed.",
  "photos.tooBig": "That image is too big — the limit is 5 MB.",
  "profile.mutualFriend": "Mutual friend",
  "profile.noFriends": "No friends yet.",
  "profile.tapPhoto": "Tap a photo to see it full size.",
  "profile.memberSince": "On Gizycko since",
  "profile.active": "active",
  "profile.nothingPosted": "Nothing posted yet.",
  "profile.nothingPublic":
    "Nothing public to show. Add them as a friend to see more.",
  "profile.youKnowToo": "you know too",

  // feed
  "feed.emptyFiltered": "Nothing matches those filters. Try widening them.",
  "feed.empty":
    "Nothing here yet. Write the first post, or head to Discover to meet people.",
  "feed.attachedSong": "Attached song",
  "feed.comments": "Comments",
  "feed.commentPlaceholder": "Write a comment…",
  "feed.noComments": "No comments yet.",
  "feed.commentDeleted": "This comment was deleted.",
  "feed.commentsCount": "comments",
  "feed.sortNew": "Newest",
  "feed.sortTop": "Most liked",
  "feed.sortDiscussed": "Most discussed",
  "feed.fromAll": "Everyone",
  "feed.fromFriends": "Friends",
  "feed.fromMatches": "Matches",
  "feed.fromMine": "Just me",
  "feed.hasAll": "Anything",
  "feed.hasPhotos": "Photos",
  "feed.hasVideo": "Video",
  "feed.hasSong": "Songs",
  "feed.postsOne": "post",
  "feed.postsMany": "posts",
  "feed.sortLabel": "Sort",
  "feed.fromLabel": "From",
  "feed.withLabel": "With",
  "action.clear": "Clear",

  "composer.placeholder": "What is going on?",
  "composer.messagePlaceholder": "Write a message…",
  "composer.photos": "Photos",
  "composer.song": "Song",
  "composer.video": "Video",
  "composer.voice": "Voice",
  "composer.camera": "Camera",
  "composer.emoji": "Emoji",
  "composer.attach": "Attach a photo, video, or song",
  "composer.visibleTo": "Visible to",
  "composer.searchEmoji": "Search: face, heart, food…",

  "visibility.public": "Everyone",
  "visibility.friends": "Friends",
  "visibility.matches": "Matches",
  "visibility.private": "Only me",

  // discover
  "discover.title": "Discover",
  "discover.intro":
    "New people who match your preferences. Like someone to see if they like you back — if you both do, it becomes a match and you can message.",
  "discover.empty":
    "No one new right now. Check back later, or widen your age and distance preferences in your profile.",
  "discover.pass": "Pass",
  "discover.like": "Like",

  // matches
  "matches.title": "Matches",
  "matches.empty": "No matches yet. Like a few people in Discover.",
  "matches.sayHello": "You matched. Say hello.",
  "matches.unmatch": "Unmatch",

  // messages
  "messages.title": "Messages",
  "messages.intro":
    "Every conversation you have. Tap a photo to open the profile, the name to open the chat.",
  "messages.all": "All",
  "messages.unread": "Unread",
  "messages.search": "Search names and messages",
  "messages.markAllRead": "Mark all read",
  "messages.markRead": "Mark read",
  "messages.markUnread": "Mark unread",
  "messages.empty":
    "No conversations yet. Match with someone in Discover and you can message them here.",
  "messages.noResults": "Nothing matches that.",
  "messages.ended": "ended",
  "messages.you": "You:",

  "chat.empty": "No messages yet. Say hello.",
  "chat.closed": "This conversation is closed.",
  "chat.noVideo": "Your browser cannot play this video.",
  "chat.noAudio": "Your browser cannot play this audio.",
  "chat.audio": "Audio",
  "chat.reply": "Reply",
  "chat.edit": "Edit",
  "chat.copyText": "Copy text",
  "chat.copyLink": "Copy message link",
  "chat.edited": "edited",
  "chat.replyingTo": "Replying to",
  "chat.editing": "Editing message",
  "chat.messageActions": "Message actions",
  "chat.you": "You",
  "chat.sendHint": "Enter to send, Shift+Enter for a new line",
  "chat.messageDeleted": "This message was deleted.",
  "chat.deleteMessage": "Delete this message",
  "chat.react": "React",

  // friends
  "friends.title": "Friends",
  "friends.requests": "Requests",
  "friends.requestsHint": "waiting for your answer",
  "friends.requestsEmpty": "No requests right now.",
  "friends.yours": "Your friends",
  "friends.yoursEmpty":
    "No friends yet. Add someone from the suggestions below.",
  "friends.suggestions": "People you could add",
  "friends.suggestionsHint": "not connected yet",
  "friends.suggestionsEmpty":
    "Nobody new to suggest. Try Discover to meet more people.",
  "friends.add": "Add friend",
  "friends.requested": "Requested",
  "friends.friendsRemove": "Friends · remove",
  "friends.requestedCancel": "Request sent · cancel",
  "action.blocked": "Blocked",
  "action.blockConfirm": "Block them?",
  "action.yes": "Yes",
  "action.no": "No",

  // groups
  "groups.title": "Groups",
  "groups.create": "Create a group",
  "groups.yours": "Your groups",
  "groups.yoursEmpty": "You are not in any group yet.",
  "groups.invites": "Invitations",
  "groups.discover": "Groups to join",
  "groups.discoverEmpty": "No groups to show yet. Create the first one.",
  "groups.rules": "Group rules",
  "groups.members": "Members",
  "groups.membersOne": "member",
  "groups.membersMany": "members",
  "groups.postsEmpty": "No posts in this group yet.",
  "groups.owner": "Owner",
  "groups.admin": "Admin",
  "groups.member": "Member",
  "groups.makeAdmin": "Make admin",
  "groups.removeAdmin": "Remove admin",
  "groups.makeOwner": "Make owner",
  "groups.ban": "Ban",
  "groups.banned": "Banned",
  "groups.invitePeople": "Invite people",
  "groups.inviteFriends": "Your friends",
  "groups.you": "you",
  "groups.composerPlaceholder": "Share something with the group",
  "groups.attached": "Attached",
  "groups.membersOnly": "Only members can see this.",
  "groups.settingsTitle": "Group settings",
  "groups.settingsHint": "owners and admins",
  "groups.name": "Name",
  "groups.description": "Description",
  "groups.whoCanJoin": "Who can join",
  "groups.visPublic": "Public",
  "groups.visPrivate": "Private",
  "groups.visPublicHint": "Public — anyone can find and join",
  "groups.visPrivateHint": "Private — invitation only",
  "groups.rulesHint":
    "Shown to everyone who opens the group. Leave empty for none.",
  "groups.deleting": "Deleting…",
  "groups.deleteGroup": "Delete this group",
  "groups.deleteConfirm":
    "Delete this group and every post in it? This cannot be undone.",
  "groups.youOwn": "You own this group",
  "groups.leaving": "Leaving…",
  "groups.joining": "Joining…",
  "groups.inviteOnly": "Invitation only",
  "groups.searchPeople": "Start typing a name…",
  "groups.searching": "Searching…",
  "groups.noMatches": "Nobody matching, or they are already here.",
  "groups.bannedEmpty": "Nobody is banned.",
  "groups.noReason": "No reason given",
  "groups.newTitle": "New group",
  "groups.newIntro":
    "You will be its owner, and can invite people once it exists.",
  "groups.namePlaceholder": "Weekend hikers",
  "groups.purpose": "What is it for?",
  "groups.purposePlaceholder": "Who it is for, and what you will post here.",
  "groups.creating": "Creating…",
  "groups.createGroup": "Create group",
  "groups.intro": "A space to share with several people at once.",
  "groups.new": "New group",
  "groups.invitesEmpty": "No invitations right now.",
  "groups.invitedBy": "invited by",
  "groups.private": "private",
  "groups.public": "public",
  "groups.inviteFriendsTitle": "Invite friends",
  "groups.pending": "pending",
  "groups.allInvited": "All your friends are already here, or invited.",
  "groups.roleHint":
    "Owners appoint admins and hand the group over. Admins invite people, remove members, edit the group, and delete any post. Members read and write posts.",
  "groups.startConversation":
    "Nothing posted here yet. Start the conversation.",
  "groups.joinToRead": "Join this group to read and write its posts.",
  "groups.postsCount": "posts",
  "groups.publicToJoin": "Public groups to join",
  "groups.publicEmpty": "Nothing public to join right now.",
  "groups.yoursEmptyLong":
    "You are not in any group yet. Create one, or join a public group below.",

  // other
  "notifications.title": "Notifications",
  "notifications.empty": "Nothing yet.",
  "notifications.someone": "Someone",
  "notifications.match": "matched with you",
  "notifications.message": "sent you a message",
  "notifications.profileLike": "liked your profile",
  "notifications.friendRequest": "sent you a friend request",
  "notifications.friendAccepted": "accepted your friend request",
  "notifications.postReaction": "reacted to your post",
  "notifications.postComment": "commented on your post",
  "notifications.other": "did something",

  "help.title": "Help",
  "help.intro":
    "The questions people ask most. If yours is not here, write to us.",
  "help.q1": "How does matching work?",
  "help.a1":
    "Discover shows people who match your preferences — the genders you want to meet, your age range, and who has not been blocked. Like someone and nothing happens on their side until they like you back. When you both do, it becomes a match and a conversation opens.",
  "help.q2": "What is the difference between a match and a friend?",
  "help.a2":
    "A match comes from Discover and is about dating. A friend is a social connection: friends see each other's friends-only posts and can message without ever swiping. Matches appear under Matches, and every conversation of either kind appears under Messages.",
  "help.q3": "Who can see my posts?",
  "help.a3":
    "You choose per post: everyone, friends, matches, or only you. Change it in the dropdown next to the Post button before you publish.",
  "help.q4": "Why can nobody see my profile?",
  "help.a4":
    "Check that your profile is set to visible on your profile page, and that your age and distance preferences are not so narrow that few people qualify. Profiles without a photo also get far less attention.",
  "help.q5": "Someone is bothering me. What do I do?",
  "help.a5":
    "Block them, and report them. Blocking hides you from each other, ends any match, and stops all messages — they are never told. Reporting sends the details to our moderators. Both buttons are on every profile, post, comment, and conversation.",
  "help.q6": "How do I delete my account?",
  "help.a6":
    "Settings, then Delete my account. It removes your profile, photos, matches, messages, and posts. You can download everything first with Download my data.",
  "help.stuck": "Still stuck?",
  "help.contact":
    "Email us and tell us what happened. If it is about another member, include their name so moderators can find them.",
  "help.emergency":
    "In an emergency call your local emergency number — 112 across Europe and much of the world, 911 in North America. Our safety advice covers meeting someone for the first time.",
  "help.safetyLink": "safety advice",
  "media.discardRecording": "Discard recording",
  "media.stopRecording": "Stop recording",
  "media.recordVoice": "Record a voice note",
  "media.noMic": "No microphone available.",
  "media.micRefused": "Microphone permission refused.",
  "media.discardPhoto": "Discard photo",
  "media.takePhoto": "Take a photo",
  "media.noCamera": "No camera available.",
  "media.cameraRefused": "Camera permission refused.",
  "media.camera": "Camera",
  "report.why": "Why are you reporting this?",
  "report.choose": "Choose a reason",
  "report.details": "Anything else we should know? (optional)",
  "report.sending": "Sending…",
  "report.send": "Send report",
  "report.done": "Reported. Our moderators will look at it.",

  "empty.feed": "Nothing here yet.",
  "empty.messages": "No conversations yet.",
  "empty.notifications": "Nothing yet.",

  "language.untranslated": "Not translated yet — shown in English",
  "search.people": "Search people by name",
  "search.groups": "Search groups",
  "search.results": "Results",
  "search.noPeople": "Nobody by that name.",
  "search.noGroups": "No group by that name.",
  "search.clear": "Clear search",
  "groups.inviteAnyone": "Invite anyone by name",
  "landing.badge": "Open worldwide",
  "landing.headline": "Meet people nearby.",
  "landing.headline2": "Stay for the community.",
  "landing.intro":
    "A dating app with a real social side — match, chat, and share what you are up to with the people you actually know. In your language, wherever you are.",
  "landing.create": "Create an account",
  "landing.have": "I already have one",
  "landing.note": "18+ only. Be kind — every profile is a real person.",
  "landing.mostFollowed": "Most followed",
  "landing.onGizycko": "On Gizycko",
  "landing.follower": "follower",
  "landing.followers": "followers",
  "landing.f1": "Match honestly",
  "landing.f1b": "Preferences, age range, and distance you actually control.",
  "landing.f2": "Talk properly",
  "landing.f2b":
    "Every match gets a private conversation. No paywall to reply.",
  "landing.f3": "Stay safe",
  "landing.f3b": "Block and report from any profile, post, or message.",
  "auth.linkNotValid": "Link not valid",
  "auth.welcomeBack": "Welcome back",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.signIn": "Sign in",
  "auth.signingIn": "Signing in…",
  "auth.wrongCredentials": "Wrong email or password.",
  "auth.forgot": "Forgot your password?",
  "auth.noAccount": "No account yet?",
  "auth.createOne": "Create one",
  "auth.createAccount": "Create an account",
  "auth.checkInbox": "Check your inbox",
  "auth.mustVerify":
    "Confirm your email address before signing in. The link is in your inbox.",
  "auth.confirmFirst":
    "Open the link to confirm your address. You can sign in once that is done.",
  "auth.sentTo": "We have sent a confirmation link to",
  "auth.confirmWhy":
    "Open it to confirm your address. You can finish setting up your profile in the meantime.",
  "auth.continueSetup": "Set up my profile",
  "auth.noEmail": "Nothing arrived? Check your spam folder, or",
  "auth.sendAgain": "send it again",
  "auth.sentAgain": "Sent. Give it a minute.",
  "auth.over18": "You must be 18 or older.",
  "auth.firstName": "First name",
  "auth.passwordHint": "At least 10 characters.",
  "auth.creating": "Creating…",
  "auth.haveAccount": "Already have an account?",
  "auth.createFailed": "Could not create the account.",
  "auth.checkEmail": "Check your email",
  "auth.resetSent":
    "If an account exists for that address, we have sent a link to reset the password. It expires in an hour.",
  "auth.backToSignIn": "Back to sign in",
  "auth.forgotIntro": "We will email you a link to set a new one.",
  "auth.sending": "Sending…",
  "auth.sendResetLink": "Send reset link",
  "auth.newPasswordTitle": "Choose a new password",
  "auth.newPassword": "New password",
  "auth.repeatPassword": "Repeat it",
  "auth.setNewPassword": "Set new password",
  "auth.passwordsDiffer": "The two passwords do not match.",
  "auth.linkExpired": "That link is no longer valid.",
  "auth.termsAccept": "I am 18 or older and accept the",
  "auth.terms": "Terms",
  "auth.and": "and",
  "auth.privacy": "Privacy Policy",
  "action.unblocking": "Unblocking…",
  "feed.comment": "Comment",
  "photos.viewer": "Photo",
  "photos.previous": "Previous photo",
  "photos.next": "Next photo",
  "onboarding.dateOfBirth": "Date of birth",
  "onboarding.bioPlaceholder": "What are you into? What are you looking for?",
  "onboarding.continue": "Continue",
  "onboarding.title": "Tell us about you",
  "onboarding.intro":
    "This is what other people will see. You can change it any time.",
  "onboarding.ageNote":
    "Only your age is shown to others, never the exact date.",
  "onboarding.iAm": "I am",
} as const;

export type MessageKey = keyof typeof en;
export type Dictionary = Partial<Record<MessageKey, string>>;

/**
 * Locales with a hand-written dictionary. Everything else in the picker falls
 * back to English, and the picker says so.
 */
export const DICTIONARIES: Record<string, Dictionary> = {
  en,
  pl,
  de,
  fr,
  es,
  // Latin American Spanish shares this vocabulary with Peninsular Spanish.
  "es-MX": es,
  uk,
  ja,
  ar,
  // Egyptian Arabic shares Modern Standard wording for these words.
  arz: ar,
  "zh-Hans": zhHans,
};

export const TRANSLATED_LOCALES = new Set(Object.keys(DICTIONARIES));

/** Look up one string, falling back to English, then to the key itself. */
export function translate(locale: string, key: MessageKey): string {
  return DICTIONARIES[locale]?.[key] ?? en[key] ?? key;
}

/**
 * Every string resolved for one locale, English-filled.
 *
 * The app layout sends this to the browser so client components can translate
 * without a `labels` prop threaded through every level.
 */
export function messagesFor(locale: string): Record<string, string> {
  const dictionary = DICTIONARIES[locale];
  if (!dictionary) return { ...en };

  return { ...en, ...dictionary };
}

export { DEFAULT_LOCALE };

export interface Activity {
  id: string
  type: 'handle_claimed' | 'booking_received' | 'upgrade' | 'milestone'
  user: {
    name: string
    avatar: string
  }
  handle?: string
  action: string
  timestamp: string
  icon: string
}

export const activities: Activity[] = [
  {
    id: '1',
    type: 'handle_claimed',
    user: {
      name: 'Sarah Mitchell',
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
    handle: 'sarah-lashes',
    action: 'claimed onprez.com/sarah-lashes',
    timestamp: '2m ago',
    icon: '🎉',
  },
  {
    id: '2',
    type: 'booking_received',
    user: {
      name: 'Mike Chen',
      avatar: 'https://i.pravatar.cc/150?img=12',
    },
    action: 'received his 5th booking today',
    timestamp: '5m ago',
    icon: '📅',
  },
  {
    id: '3',
    type: 'handle_claimed',
    user: {
      name: 'Emma Rodriguez',
      avatar: 'https://i.pravatar.cc/150?img=5',
    },
    handle: 'emma-massage',
    action: 'claimed onprez.com/emma-massage',
    timestamp: '8m ago',
    icon: '🎉',
  },
  {
    id: '4',
    type: 'upgrade',
    user: {
      name: 'James Wilson',
      avatar: 'https://i.pravatar.cc/150?img=15',
    },
    action: 'upgraded to Premium',
    timestamp: '12m ago',
    icon: '⭐',
  },
  {
    id: '5',
    type: 'milestone',
    user: {
      name: 'Lisa Anderson',
      avatar: 'https://i.pravatar.cc/150?img=9',
    },
    action: 'got 247 visits this week',
    timestamp: '15m ago',
    icon: '📊',
  },
  {
    id: '6',
    type: 'booking_received',
    user: {
      name: 'David Kim',
      avatar: 'https://i.pravatar.cc/150?img=18',
    },
    action: 'received 3 bookings in the last hour',
    timestamp: '18m ago',
    icon: '🔥',
  },
  {
    id: '7',
    type: 'handle_claimed',
    user: {
      name: 'Rachel Green',
      avatar: 'https://i.pravatar.cc/150?img=24',
    },
    handle: 'rachel-yoga',
    action: 'claimed onprez.com/rachel-yoga',
    timestamp: '22m ago',
    icon: '🎉',
  },
  {
    id: '8',
    type: 'milestone',
    user: {
      name: 'Tom Bradley',
      avatar: 'https://i.pravatar.cc/150?img=8',
    },
    action: 'reached 50 total bookings',
    timestamp: '25m ago',
    icon: '🎯',
  },
  {
    id: '9',
    type: 'upgrade',
    user: {
      name: 'Nina Patel',
      avatar: 'https://i.pravatar.cc/150?img=30',
    },
    action: 'upgraded to Premium',
    timestamp: '28m ago',
    icon: '⭐',
  },
  {
    id: '10',
    type: 'booking_received',
    user: {
      name: 'Alex Turner',
      avatar: 'https://i.pravatar.cc/150?img=14',
    },
    action: 'received a new booking',
    timestamp: '32m ago',
    icon: '📅',
  },
  {
    id: '11',
    type: 'handle_claimed',
    user: {
      name: 'Sophie Martin',
      avatar: 'https://i.pravatar.cc/150?img=22',
    },
    handle: 'sophie-nails',
    action: 'claimed onprez.com/sophie-nails',
    timestamp: '35m ago',
    icon: '🎉',
  },
  {
    id: '12',
    type: 'milestone',
    user: {
      name: 'Chris Evans',
      avatar: 'https://i.pravatar.cc/150?img=33',
    },
    action: 'got 500+ profile views',
    timestamp: '40m ago',
    icon: '👀',
  },
]

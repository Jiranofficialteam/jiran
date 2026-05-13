export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ad_campaigns: {
        Row: {
          boost_likes: number
          boost_views: number
          budget: number
          created_at: string
          duration_days: number
          id: string
          payment_method: string | null
          post_id: string
          sender_number: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          target_audience: string | null
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          boost_likes?: number
          boost_views?: number
          budget?: number
          created_at?: string
          duration_days?: number
          id?: string
          payment_method?: string | null
          post_id: string
          sender_number?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          target_audience?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          boost_likes?: number
          boost_views?: number
          budget?: number
          created_at?: string
          duration_days?: number
          id?: string
          payment_method?: string | null
          post_id?: string
          sender_number?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          target_audience?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaigns_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_clicks: {
        Row: {
          ad_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          ad_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          ad_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_clicks_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_impressions: {
        Row: {
          ad_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          ad_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          ad_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_impressions_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      ads: {
        Row: {
          ad_type: string
          budget: number
          clicks: number
          cpc: number
          cpm: number
          created_at: string
          created_by: string
          description: string | null
          destination_url: string | null
          end_date: string | null
          id: string
          image_url: string | null
          impressions: number
          placement: string
          spent: number
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          ad_type?: string
          budget?: number
          clicks?: number
          cpc?: number
          cpm?: number
          created_at?: string
          created_by: string
          description?: string | null
          destination_url?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          impressions?: number
          placement?: string
          spent?: number
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          ad_type?: string
          budget?: number
          clicks?: number
          cpc?: number
          cpm?: number
          created_at?: string
          created_by?: string
          description?: string | null
          destination_url?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          impressions?: number
          placement?: string
          spent?: number
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name: string
          requirement_type?: string
          requirement_value?: number
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      close_friends: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          parent_id: string | null
          post_id: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          parent_id?: string | null
          post_id: string
          text: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          parent_id?: string | null
          post_id?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_members: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          is_group: boolean
          name: string | null
          vanish_mode: boolean | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_group?: boolean
          name?: string | null
          vanish_mode?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          is_group?: boolean
          name?: string | null
          vanish_mode?: boolean | null
        }
        Relationships: []
      }
      creator_earnings: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          source_id: string | null
          source_type: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          source_id?: string | null
          source_type?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          source_id?: string | null
          source_type?: string
          user_id?: string
        }
        Relationships: []
      }
      creator_monetization: {
        Row: {
          applied_at: string
          approved_at: string | null
          created_at: string
          id: string
          pending_payout: number
          revenue_share_percent: number
          status: string
          total_earnings: number
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string
          approved_at?: string | null
          created_at?: string
          id?: string
          pending_payout?: number
          revenue_share_percent?: number
          status?: string
          total_earnings?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string
          approved_at?: string | null
          created_at?: string
          id?: string
          pending_payout?: number
          revenue_share_percent?: number
          status?: string
          total_earnings?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_logins: {
        Row: {
          created_at: string
          id: string
          login_date: string
          reward_coins: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          login_date?: string
          reward_coins?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          login_date?: string
          reward_coins?: number
          user_id?: string
        }
        Relationships: []
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string | null
          cover_url: string | null
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          event_date: string
          id: string
          is_online: boolean | null
          location: string | null
          online_link: string | null
          title: string
        }
        Insert: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          event_date: string
          id?: string
          is_online?: boolean | null
          location?: string | null
          online_link?: string | null
          title: string
        }
        Update: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          event_date?: string
          id?: string
          is_online?: boolean | null
          location?: string | null
          online_link?: string | null
          title?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      fundraiser_donations: {
        Row: {
          amount: number
          created_at: string
          donor_id: string
          fundraiser_id: string
          id: string
          is_anonymous: boolean | null
          message: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          donor_id: string
          fundraiser_id: string
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          donor_id?: string
          fundraiser_id?: string
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fundraiser_donations_fundraiser_id_fkey"
            columns: ["fundraiser_id"]
            isOneToOne: false
            referencedRelation: "fundraisers"
            referencedColumns: ["id"]
          },
        ]
      }
      fundraisers: {
        Row: {
          category: string | null
          cover_url: string | null
          created_at: string
          created_by: string
          currency: string | null
          description: string | null
          end_date: string | null
          goal_amount: number
          id: string
          is_active: boolean | null
          raised_amount: number
          title: string
        }
        Insert: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          created_by: string
          currency?: string | null
          description?: string | null
          end_date?: string | null
          goal_amount?: number
          id?: string
          is_active?: boolean | null
          raised_amount?: number
          title: string
        }
        Update: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string
          currency?: string | null
          description?: string | null
          end_date?: string | null
          goal_amount?: number
          id?: string
          is_active?: boolean | null
          raised_amount?: number
          title?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          cover_url: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_private: boolean
          name: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_private?: boolean
          name: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_private?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      highlight_stories: {
        Row: {
          added_at: string
          highlight_id: string
          id: string
          story_id: string
        }
        Insert: {
          added_at?: string
          highlight_id: string
          id?: string
          story_id: string
        }
        Update: {
          added_at?: string
          highlight_id?: string
          id?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "highlight_stories_highlight_id_fkey"
            columns: ["highlight_id"]
            isOneToOne: false
            referencedRelation: "story_highlights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "highlight_stories_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          category: string | null
          condition: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          images: string[] | null
          is_sold: boolean
          location: string | null
          price: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          condition?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_sold?: boolean
          location?: string | null
          price?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          condition?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_sold?: boolean
          location?: string | null
          price?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          conversation_id: string
          created_at: string
          expires_at: string | null
          id: string
          media_type: string | null
          media_url: string | null
          read_by: string[] | null
          sender_id: string
          text: string | null
        }
        Insert: {
          conversation_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          read_by?: string[] | null
          sender_id: string
          text?: string | null
        }
        Update: {
          conversation_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          read_by?: string[] | null
          sender_id?: string
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string
          comment_id: string | null
          created_at: string
          id: string
          post_id: string | null
          read: boolean
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          actor_id: string
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          read?: boolean
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          actor_id?: string
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          read?: boolean
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      page_followers: {
        Row: {
          created_at: string
          id: string
          page_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          page_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          page_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_followers_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          avatar_url: string | null
          category: string
          cover_url: string | null
          created_at: string
          description: string | null
          follower_count: number
          id: string
          name: string
          owner_id: string
          updated_at: string
          username: string
          verified: boolean
        }
        Insert: {
          avatar_url?: string | null
          category?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          follower_count?: number
          id?: string
          name: string
          owner_id: string
          updated_at?: string
          username: string
          verified?: boolean
        }
        Update: {
          avatar_url?: string | null
          category?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          follower_count?: number
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
          username?: string
          verified?: boolean
        }
        Relationships: []
      }
      payout_requests: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          id: string
          payment_method: string
          payment_number: string
          processed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          id?: string
          payment_method?: string
          payment_number?: string
          processed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          id?: string
          payment_method?: string
          payment_number?: string
          processed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      poll_options: {
        Row: {
          created_at: string
          id: string
          poll_id: string
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          poll_id: string
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          poll_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          post_id: string | null
          question: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          post_id?: string | null
          question: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          post_id?: string | null
          question?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "polls_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "polls_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "polls_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          caption: string | null
          created_at: string
          hashtags: string[] | null
          id: string
          image_url: string | null
          images: string[] | null
          is_live: boolean | null
          live_viewers: number | null
          location: string | null
          page_id: string | null
          type: Database["public"]["Enums"]["post_type"]
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_live?: boolean | null
          live_viewers?: number | null
          location?: string | null
          page_id?: string | null
          type?: Database["public"]["Enums"]["post_type"]
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_live?: boolean | null
          live_viewers?: number | null
          location?: string | null
          page_id?: string | null
          type?: Database["public"]["Enums"]["post_type"]
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_visits: {
        Row: {
          id: string
          profile_id: string
          visited_at: string
          visitor_id: string | null
        }
        Insert: {
          id?: string
          profile_id: string
          visited_at?: string
          visitor_id?: string | null
        }
        Update: {
          id?: string
          profile_id?: string
          visited_at?: string
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_visits_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_visits_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_visits_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_visits_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: string
          avatar_url: string | null
          ban_reason: string | null
          ban_until: string | null
          bio: string | null
          birth_date: string | null
          cover_url: string | null
          created_at: string
          first_name: string | null
          follower_boost: number
          full_name: string
          gender: string | null
          id: string
          is_banned: boolean
          is_private: boolean
          last_name: string | null
          last_seen: string | null
          updated_at: string
          username: string
          verified: boolean
          website: string | null
        }
        Insert: {
          account_type?: string
          avatar_url?: string | null
          ban_reason?: string | null
          ban_until?: string | null
          bio?: string | null
          birth_date?: string | null
          cover_url?: string | null
          created_at?: string
          first_name?: string | null
          follower_boost?: number
          full_name?: string
          gender?: string | null
          id: string
          is_banned?: boolean
          is_private?: boolean
          last_name?: string | null
          last_seen?: string | null
          updated_at?: string
          username: string
          verified?: boolean
          website?: string | null
        }
        Update: {
          account_type?: string
          avatar_url?: string | null
          ban_reason?: string | null
          ban_until?: string | null
          bio?: string | null
          birth_date?: string | null
          cover_url?: string | null
          created_at?: string
          first_name?: string | null
          follower_boost?: number
          full_name?: string
          gender?: string | null
          id?: string
          is_banned?: boolean
          is_private?: boolean
          last_name?: string | null
          last_seen?: string | null
          updated_at?: string
          username?: string
          verified?: boolean
          website?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
          reward_claimed: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
          reward_claimed?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
          reward_claimed?: boolean
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          post_id: string | null
          reason: string
          reporter_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          post_id?: string | null
          reason?: string
          reporter_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string | null
          reason?: string
          reporter_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      saves: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saves_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_type: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_type?: string
          setting_value?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_type?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          background: string | null
          created_at: string
          elements: Json | null
          expires_at: string
          id: string
          is_close_friends_only: boolean | null
          media_type: string
          media_url: string
          user_id: string
        }
        Insert: {
          background?: string | null
          created_at?: string
          elements?: Json | null
          expires_at: string
          id?: string
          is_close_friends_only?: boolean | null
          media_type?: string
          media_url: string
          user_id: string
        }
        Update: {
          background?: string | null
          created_at?: string
          elements?: Json | null
          expires_at?: string
          id?: string
          is_close_friends_only?: boolean | null
          media_type?: string
          media_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      story_highlights: {
        Row: {
          cover_url: string | null
          created_at: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          id?: string
          title?: string
          user_id: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      story_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji?: string
          id?: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          story_id?: string
          user_id?: string
        }
        Relationships: []
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_points: {
        Row: {
          coins: number
          created_at: string
          daily_streak: number
          id: string
          last_login_date: string | null
          level: number
          referral_code: string
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          coins?: number
          created_at?: string
          daily_streak?: number
          id?: string
          last_login_date?: string | null
          level?: number
          referral_code?: string
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          coins?: number
          created_at?: string
          daily_streak?: number
          id?: string
          last_login_date?: string | null
          level?: number
          referral_code?: string
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          document_url: string | null
          full_name: string
          id: string
          reason: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          document_url?: string | null
          full_name?: string
          id?: string
          reason?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          document_url?: string | null
          full_name?: string
          id?: string
          reason?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      approved_creators: {
        Row: {
          approved_at: string | null
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      boost_stats: {
        Row: {
          boost_likes: number | null
          boost_views: number | null
          id: string | null
          post_id: string | null
          status: Database["public"]["Enums"]["campaign_status"] | null
          user_id: string | null
        }
        Insert: {
          boost_likes?: number | null
          boost_views?: number | null
          id?: string | null
          post_id?: string | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          user_id?: string | null
        }
        Update: {
          boost_likes?: number | null
          boost_views?: number | null
          id?: string | null
          post_id?: string | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaigns_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      fundraiser_donations_public: {
        Row: {
          amount: number | null
          created_at: string | null
          donor_id: string | null
          fundraiser_id: string | null
          id: string | null
          is_anonymous: boolean | null
          message: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          donor_id?: never
          fundraiser_id?: string | null
          id?: string | null
          is_anonymous?: boolean | null
          message?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          donor_id?: never
          fundraiser_id?: string | null
          id?: string | null
          is_anonymous?: boolean | null
          message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fundraiser_donations_fundraiser_id_fkey"
            columns: ["fundraiser_id"]
            isOneToOne: false
            referencedRelation: "fundraisers"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard: {
        Row: {
          daily_streak: number | null
          level: number | null
          user_id: string | null
          xp: number | null
        }
        Insert: {
          daily_streak?: number | null
          level?: number | null
          user_id?: string | null
          xp?: number | null
        }
        Update: {
          daily_streak?: number | null
          level?: number | null
          user_id?: string | null
          xp?: number | null
        }
        Relationships: []
      }
      profiles_public: {
        Row: {
          account_type: string | null
          avatar_url: string | null
          bio: string | null
          cover_url: string | null
          created_at: string | null
          first_name: string | null
          follower_boost: number | null
          full_name: string | null
          id: string | null
          is_private: boolean | null
          last_name: string | null
          last_seen: string | null
          updated_at: string | null
          username: string | null
          verified: boolean | null
          website: string | null
        }
        Insert: {
          account_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string | null
          first_name?: string | null
          follower_boost?: number | null
          full_name?: string | null
          id?: string | null
          is_private?: boolean | null
          last_name?: string | null
          last_seen?: string | null
          updated_at?: string | null
          username?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          account_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string | null
          first_name?: string | null
          follower_boost?: number | null
          full_name?: string | null
          id?: string | null
          is_private?: boolean | null
          last_name?: string | null
          last_seen?: string | null
          updated_at?: string | null
          username?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_xp: { Args: { _amount: number }; Returns: undefined }
      are_friends: { Args: { _a: string; _b: string }; Returns: boolean }
      claim_daily_reward: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_ad_click: { Args: { ad_uuid: string }; Returns: undefined }
      increment_ad_impression: { Args: { ad_uuid: string }; Returns: undefined }
      is_conversation_member: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      campaign_status:
        | "pending"
        | "approved"
        | "rejected"
        | "active"
        | "completed"
      notification_type:
        | "like"
        | "comment"
        | "follow"
        | "mention"
        | "story"
        | "message"
        | "friend_request"
        | "friend_accept"
      post_type: "photo" | "video" | "carousel" | "reel"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      campaign_status: [
        "pending",
        "approved",
        "rejected",
        "active",
        "completed",
      ],
      notification_type: [
        "like",
        "comment",
        "follow",
        "mention",
        "story",
        "message",
        "friend_request",
        "friend_accept",
      ],
      post_type: ["photo", "video", "carousel", "reel"],
    },
  },
} as const

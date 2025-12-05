import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { Profile } from '../types'

interface AuthStore {
  user: { id: string; email: string } | null
  profile: Profile | null
  loading: boolean
  error: string | null
  signUp: (email: string, password: string, fullName: string, role: 'student' | 'teacher') => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  loadUser: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  profile: null,
  loading: false,
  error: null,

  signUp: async (email, password, fullName, role) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role
          }
        }
      })

      if (error) throw error

      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          email,
          full_name: fullName,
          role
        })

        if (profileError) throw profileError

        set({ user: { id: data.user.id, email }, loading: false })
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      throw error
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      if (data.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle()

        if (profileError) throw profileError

        set({
          user: { id: data.user.id, email: data.user.email || '' },
          profile: profileData,
          loading: false
        })
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      throw error
    }
  },

  signOut: async () => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      set({ user: null, profile: null, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      throw error
    }
  },

  loadUser: async () => {
    set({ loading: true })
    try {
      const { data: sessionData } = await supabase.auth.getSession()

      if (sessionData.session?.user) {
        const user = sessionData.session.user
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        set({
          user: { id: user.id, email: user.email || '' },
          profile: profileData,
          loading: false
        })
      } else {
        set({ loading: false })
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  }
}))

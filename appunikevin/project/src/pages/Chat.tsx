import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Send, Plus } from 'lucide-react'
import { Message, ChatRoom } from '../types'
import './Chat.css'

export default function Chat() {
  const profile = useAuthStore((state) => state.profile)
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [showNewRoom, setShowNewRoom] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')

  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_rooms')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setChatRooms(data || [])
        if (data && data.length > 0) {
          setSelectedRoom(data[0])
        }
      } catch (error) {
        console.error('Error fetching chat rooms:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchChatRooms()
  }, [])

  useEffect(() => {
    if (!selectedRoom) return

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            created_at,
            updated_at,
            user_id,
            chat_room_id,
            profiles(full_name, avatar_url)
          `)
          .eq('chat_room_id', selectedRoom.id)
          .order('created_at', { ascending: true })

        if (error) throw error

        const formattedData = (data || []).map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          created_at: msg.created_at,
          updated_at: msg.updated_at,
          user_id: msg.user_id,
          chat_room_id: msg.chat_room_id,
          user: msg.profiles
        }))

        setMessages(formattedData)
      } catch (error) {
        console.error('Error fetching messages:', error)
      }
    }

    fetchMessages()

    const subscription = supabase
      .channel(`room:${selectedRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${selectedRoom.id}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [selectedRoom])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || !profile) return

    try {
      const { error } = await supabase.from('messages').insert({
        chat_room_id: selectedRoom.id,
        user_id: profile.id,
        content: newMessage
      })

      if (error) throw error
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleCreateRoom = async () => {
    if (!newRoomName.trim() || !profile) return

    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          name: newRoomName,
          room_type: 'group',
          created_by: profile.id
        })
        .select()

      if (error) throw error
      if (data) {
        setChatRooms([...chatRooms, data[0]])
        setSelectedRoom(data[0])
        setNewRoomName('')
        setShowNewRoom(false)
      }
    } catch (error) {
      console.error('Error creating room:', error)
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h2>Conversaciones</h2>
          <button onClick={() => setShowNewRoom(true)} className="new-room-btn">
            <Plus size={20} />
          </button>
        </div>

        {showNewRoom && (
          <div className="new-room-form">
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Nombre de la sala"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
            />
            <button onClick={handleCreateRoom} className="create-btn">Crear</button>
            <button onClick={() => setShowNewRoom(false)} className="cancel-btn">Cancelar</button>
          </div>
        )}

        <div className="rooms-list">
          {loading ? (
            <p>Cargando conversaciones...</p>
          ) : chatRooms.length === 0 ? (
            <p>No hay conversaciones</p>
          ) : (
            chatRooms.map((room) => (
              <button
                key={room.id}
                className={`room-item ${selectedRoom?.id === room.id ? 'active' : ''}`}
                onClick={() => setSelectedRoom(room)}
              >
                <span className="room-name">{room.name}</span>
                <span className="room-type">{room.room_type}</span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="chat-main">
        {selectedRoom ? (
          <>
            <div className="chat-header">
              <h2>{selectedRoom.name}</h2>
              <p>{selectedRoom.description}</p>
            </div>

            <div className="messages-container">
              {messages.map((message) => (
                <div key={message.id} className="message">
                  <div className="message-info">
                    <span className="message-author">{(message.user as any)?.full_name || 'Usuario'}</span>
                    <span className="message-time">
                      {new Date(message.created_at).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="message-content">{message.content}</p>
                </div>
              ))}
            </div>

            <div className="message-input-group">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Escribe un mensaje..."
              />
              <button onClick={handleSendMessage}>
                <Send size={20} />
              </button>
            </div>
          </>
        ) : (
          <div className="no-room">Selecciona una conversación</div>
        )}
      </div>
    </div>
  )
}

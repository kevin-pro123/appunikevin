import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Book as BookIcon, Download } from 'lucide-react'
import { Book } from '../types'
import './Library.css'

export default function Library() {
  const [books, setBooks] = useState<Book[]>([])
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setBooks(data || [])
        setFilteredBooks(data || [])
      } catch (error) {
        console.error('Error fetching books:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBooks()
  }, [])

  useEffect(() => {
    const filtered = books.filter(
      (book) =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredBooks(filtered)
  }, [searchTerm, books])

  return (
    <div className="library">
      <div className="page-header">
        <h1>Biblioteca Digital</h1>
        <p>Accede a recursos bibliográficos y documentación académica</p>
      </div>

      <div className="search-bar">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por título o autor..."
        />
      </div>

      {loading ? (
        <div className="loading">Cargando biblioteca...</div>
      ) : filteredBooks.length === 0 ? (
        <div className="empty-state">
          <BookIcon size={48} />
          <p>{searchTerm ? 'No se encontraron libros' : 'No hay libros disponibles'}</p>
        </div>
      ) : (
        <div className="books-grid">
          {filteredBooks.map((book) => (
            <div key={book.id} className="book-card">
              <div className="book-cover">
                {book.cover_url ? (
                  <img src={book.cover_url} alt={book.title} />
                ) : (
                  <div className="placeholder">
                    <BookIcon size={48} />
                  </div>
                )}
              </div>
              <div className="book-info">
                <h3>{book.title}</h3>
                <p className="author">{book.author}</p>
                {book.isbn && <p className="isbn">ISBN: {book.isbn}</p>}
                {book.publisher && <p className="publisher">{book.publisher}</p>}
                <p className="availability">
                  <span className={book.available_copies > 0 ? 'available' : 'unavailable'}>
                    {book.available_copies > 0 ? `${book.available_copies} disponibles` : 'No disponible'}
                  </span>
                </p>
                {book.file_url && (
                  <a href={book.file_url} target="_blank" rel="noopener noreferrer" className="download-btn">
                    <Download size={18} />
                    <span>Descargar</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

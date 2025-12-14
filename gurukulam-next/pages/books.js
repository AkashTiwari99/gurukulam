import Head from 'next/head';
import Layout from '../components/Layout';
import Link from 'next/link';

export default function Books() {
    return (
        <Layout>
            <Head>
                <title>Ancient Wisdom Library | Gurukulam</title>
            </Head>

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <h1>Ancient Wisdom for Modern Times</h1>
                    <p>Explore our curated collection of timeless knowledge</p>
                </div>
            </section>

            {/* Library Section */}
            <section className="library-section">
                <h2 className="section-title">Digital Library</h2>
                <p className="section-desc">Dive into the profound knowledge of ancient texts beautifully preserved.</p>

                <div className="book-grid">
                    {[
                        { title: "Ramayana", desc: "The epic tale of Lord Rama", link: "/Books/book_link/Bala_Srga.html", icon: "fas fa-book" },
                        { title: "Shloka Mala 1", desc: "Good values of Ramayana", link: "/Books/Shlok mala/shlok_mala_1.html", icon: "fas fa-lightbulb" },
                        { title: "Shloka Mala 2", desc: "Good values of Ramayana", link: "/Books/Shlok mala/shlok_mala_2.html", icon: "fas fa-book-open" },
                        { title: "Reviving Vedic Knowledge", desc: "A guide to ancient wisdom", link: "/Books/Books.pdf/REVIVING VEDIC KNOWLEDGE.pdf", icon: "fas fa-scroll" },
                        { title: "Ancient Educational Structures", desc: "Learning systems of the past", link: "/Books/Books.pdf/Ancient Educational Structures.pdf", icon: "fas fa-university" },
                        { title: "Social Entrepreneurship", desc: "Ancient principles for modern business", link: "/Books/Books.pdf/Social entrepreneurship with vedic wisdom.pdf", icon: "fas fa-hands-helping" },
                        { title: "Wisdom of Hindus", desc: "Exploring Hindu philosophy", link: "/Books/Books.pdf/The wisdom of the Hindus.pdf", icon: "fas fa-om" },
                        { title: "Vedic Wisdom", desc: "Foundations of Vedic knowledge", link: "/Books/Books.pdf/Vedic Wisdom.pdf", icon: "fas fa-star-of-david" },
                        { title: "Vedic Wisdom 2", desc: "Advanced exploration of Vedic knowledge", link: "/Books/Books.pdf/VEDIC WISDOM 2.pdf", icon: "fas fa-dharmachakra" }
                    ].map((book, i) => (
                        <div className="book-card" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                            <div className="book-cover">
                                <i className={book.icon}></i>
                            </div>
                            <div className="book-info">
                                <h3>{book.title}</h3>
                                <p>{book.desc}</p>
                                <a href={book.link} className="book-btn">Read Now</a>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </Layout>
    );
}

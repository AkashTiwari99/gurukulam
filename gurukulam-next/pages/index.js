import Head from 'next/head';
import Layout from '../components/Layout';
import Link from 'next/link';

export default function Home() {
    return (
        <Layout>
            <Head>
                <title>Gurukulam | Reviving Ancient Wisdom</title>
            </Head>

            {/* Hero Section */}
            <section className="hero">
                <div className="overlay"></div>
                <div className="container hero-container">
                    <div className="hero-content">
                        <h1 className="hero-title">Ancient Wisdom for Modern Times</h1>
                        <p className="hero-subtitle">Uncover the eternal teachings of the Vedas, Ramayana, and Yoga, offering guidance for today's challenges.</p>
                        <div className="hero-buttons">
                            <Link href="/programs" className="btn btn-primary">Explore Programs</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Content */}
            <section className="features">
                <div className="container">
                    <div className="section-header">
                        <h2>Our Core Teachings</h2>
                        <p>Bridging ancient knowledge with contemporary challenges</p>
                    </div>
                    <div className="card-container">
                        <div className="card glass-panel">
                            <div className="card-image">
                                <img src="/images/card4.jpg" alt="Vedic Wisdom" />
                                <div className="card-badge">Featured</div>
                            </div>
                            <div className="card-content">
                                <h3>Vedic Wisdom</h3>
                                <p>Explore the ancient scriptures and their practical applications in modern life.</p>
                                <Link href="/books" className="btn-link">
                                    Learn More <i className="fas fa-arrow-right"></i>
                                </Link>
                            </div>
                        </div>
                        <div className="card glass-panel">
                            <div className="card-image">
                                <img src="/images/card3.jpg" alt="Gurukul System" />
                            </div>
                            <div className="card-content">
                                <h3>Gurukul System</h3>
                                <p>Experience the traditional residential education model.</p>
                                <Link href="/about" className="btn-link">
                                    Discover <i className="fas fa-arrow-right"></i>
                                </Link>
                            </div>
                        </div>
                        <div className="card glass-panel">
                            <div className="card-image">
                                <img src="/images/card2.jpg" alt="Ramayana" />
                            </div>
                            <div className="card-content">
                                <h3>Ramayana</h3>
                                <p>Learn the timeless lessons from the epic Ramayana.</p>
                                <Link href="/books" className="btn-link">
                                    Read More <i className="fas fa-arrow-right"></i>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Programs Preview */}
            <section className="programs-preview">
                <div className="container">
                    <div className="section-header">
                        <h2>Featured Programs</h2>
                        <p>Transform your understanding through our specialized courses</p>
                    </div>
                    <div className="programs-grid">
                        <div className="program-card">
                            <div className="program-icon">
                                <i className="fas fa-book-open"></i>
                            </div>
                            <h3>Sanskrit Studies</h3>
                            <p>Learn the ancient language that connects us to our roots.</p>
                            <Link href="/programs" className="btn-outline">Explore</Link>
                        </div>
                        <div className="program-card featured">
                            <div className="program-icon">
                                <i className="fas fa-pray"></i>
                            </div>
                            <h3>Yoga & Meditation</h3>
                            <p>Discover inner peace and physical harmony.</p>
                            <Link href="/programs" className="btn-outline">Explore</Link>
                        </div>
                        <div className="program-card">
                            <div className="program-icon">
                                <i className="fas fa-om"></i>
                            </div>
                            <h3>Vedic Philosophy</h3>
                            <p>Dive deep into the philosophical aspects of Vedic teachings.</p>
                            <Link href="/programs" className="btn-outline">Explore</Link>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
}

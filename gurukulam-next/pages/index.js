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
            <section class="hero">
                <div class="overlay"></div>
                <div class="container hero-container">
                    <div class="hero-content">
                        <h1 class="hero-title">Ancient Wisdom for Modern Times</h1>
                        <p class="hero-subtitle">Uncover the eternal teachings of the Vedas, Ramayana, and Yoga, offering guidance for today's challenges.</p>
                        <div class="hero-buttons">
                            <Link href="/programs" class="btn btn-primary">Explore Programs</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Content */}
            <section class="features">
                <div class="container">
                    <div class="section-header">
                        <h2>Our Core Teachings</h2>
                        <p>Bridging ancient knowledge with contemporary challenges</p>
                    </div>
                    <div class="card-container">
                        <div class="card glass-panel">
                            <div class="card-image">
                                <img src="/images/card4.jpg" alt="Vedic Wisdom" />
                                <div class="card-badge">Featured</div>
                            </div>
                            <div class="card-content">
                                <h3>Vedic Wisdom</h3>
                                <p>Explore the ancient scriptures and their practical applications in modern life.</p>
                                <Link href="/books" class="btn-link">
                                    Learn More <i class="fas fa-arrow-right"></i>
                                </Link>
                            </div>
                        </div>
                        <div class="card glass-panel">
                            <div class="card-image">
                                <img src="/images/card3.jpg" alt="Gurukul System" />
                            </div>
                            <div class="card-content">
                                <h3>Gurukul System</h3>
                                <p>Experience the traditional residential education model.</p>
                                <Link href="/about" class="btn-link">
                                    Discover <i class="fas fa-arrow-right"></i>
                                </Link>
                            </div>
                        </div>
                        <div class="card glass-panel">
                            <div class="card-image">
                                <img src="/images/card2.jpg" alt="Ramayana" />
                            </div>
                            <div class="card-content">
                                <h3>Ramayana</h3>
                                <p>Learn the timeless lessons from the epic Ramayana.</p>
                                <Link href="/books" class="btn-link">
                                    Read More <i class="fas fa-arrow-right"></i>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Programs Preview */}
            <section class="programs-preview">
                <div class="container">
                    <div class="section-header">
                        <h2>Featured Programs</h2>
                        <p>Transform your understanding through our specialized courses</p>
                    </div>
                    <div class="programs-grid">
                        <div class="program-card">
                            <div class="program-icon">
                                <i class="fas fa-book-open"></i>
                            </div>
                            <h3>Sanskrit Studies</h3>
                            <p>Learn the ancient language that connects us to our roots.</p>
                            <Link href="/programs" class="btn-outline">Explore</Link>
                        </div>
                        <div class="program-card featured">
                            <div class="program-icon">
                                <i class="fas fa-pray"></i>
                            </div>
                            <h3>Yoga & Meditation</h3>
                            <p>Discover inner peace and physical harmony.</p>
                            <Link href="/programs" class="btn-outline">Explore</Link>
                        </div>
                        <div class="program-card">
                            <div class="program-icon">
                                <i class="fas fa-om"></i>
                            </div>
                            <h3>Vedic Philosophy</h3>
                            <p>Dive deep into the philosophical aspects of Vedic teachings.</p>
                            <Link href="/programs" class="btn-outline">Explore</Link>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
}

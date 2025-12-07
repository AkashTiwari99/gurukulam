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
            <section class="hero">
                <div class="hero-content">
                    <h1>Ancient Wisdom for Modern Times</h1>
                    <p>Explore our curated collection of timeless knowledge</p>
                </div>
            </section>

            {/* Library Section */}
            <section class="library-section">
                <h2 class="section-title">Digital Library</h2>
                <p class="section-desc">Dive into the profound knowledge of ancient texts beautifully preserved.</p>

                <div class="book-grid">
                    {[
                        "Ramayana", "Shloka Mala 1", "Shloka Mala 2",
                        "Reviving Vedic Knowledge", "Ancient Educational Structures",
                        "Social Entrepreneurship", "Wisdom of Hindus", "Vedic Wisdom", "Vedic Wisdom 2"
                    ].map((title, i) => (
                        <div class="book-card" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                            <div class="book-cover">
                                <i class="fas fa-book"></i>
                            </div>
                            <div class="book-info">
                                <h3>{title}</h3>
                                <p>Explore this ancient text profoundly.</p>
                                <button class="book-btn">Read Now</button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </Layout>
    );
}

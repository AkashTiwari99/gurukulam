import Head from 'next/head';
import Layout from '../components/Layout';
import Link from 'next/link';

export default function SanatanDharma() {
    return (
        <Layout>
            <Head>
                <title>Sanatan Dharma Research Platform</title>
            </Head>

            <header className="sd-header">
                <div className="container">
                    <h1>Empowering Research and Knowledge Sharing in Sanatan Dharma</h1>
                    <p className="tagline">A platform dedicated to exploring, preserving, and sharing the timeless wisdom of Sanatan Dharma through rigorous research and community collaboration.</p>
                </div>
            </header>

            <section id="introduction">
                <div className="container">
                    <h2>Introduction</h2>
                    <p>Sanatan Dharma (often referred to as Hinduism) is one of the world's oldest living traditions, with a vast repository of scriptures, philosophies, and practices. Yet, in the modern age, much of its profound wisdom remains scattered, misinterpreted, or inaccessible to sincere seekers.</p>
                    <p>This platform is dedicated to bridging that gap—by fostering a community of educated individuals, scholars, and practitioners who are passionate about exploring, preserving, and sharing the timeless knowledge of Sanatan Dharma.</p>
                </div>
            </section>

            <section id="why-matters" className="sd-why-matters">
                <div className="container">
                    <h2>Why This Initiative Matters</h2>
                    <p>Many ancient texts and teachings are either locked in Sanskrit or diluted by misinterpretations.</p>
                    <p>Modern academia often lacks traditional insights, while traditional circles sometimes resist critical inquiry.</p>
                    <p>A unified, research-driven platform can help:</p>
                    <ul>
                        <li>Preserve authentic knowledge.</li>
                        <li>Encourage intellectual and spiritual growth.</li>
                        <li>Counter misinformation with well-researched content.</li>
                    </ul>
                </div>
            </section>

            <section id="vision-mission">
                <div className="container">
                    <h2>Our Vision & Mission</h2>
                    <h3>Vision</h3>
                    <p>To create the world's most authentic, accessible, and intellectually rigorous platform for Sanatan Dharma—where tradition meets critical scholarship.</p>

                    <h3>Mission</h3>
                    <ul>
                        <li>Promote evidence-based research on scriptures, history, and philosophy.</li>
                        <li>Facilitate respectful dialogue between scholars, practitioners, and seekers.</li>
                        <li>Build a digital library of trusted translations, commentaries, and resources.</li>
                    </ul>
                </div>
            </section>

            <section id="features">
                <div className="container">
                    <h2>Key Features of the Platform</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">📚</div>
                            <h3>In-Depth Research & Scholarship</h3>
                            <ul>
                                <li>Peer-reviewed articles on Vedas, Upanishads, Puranas, Darshanas (philosophical systems), and more.</li>
                                <li>Comparative studies between Sanatan Dharma and other world traditions.</li>
                                <li>Historical & archaeological research on Hindu civilization, temple architecture, and lost sciences.</li>
                            </ul>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">🖥️</div>
                            <h3>Knowledge Repository (Free & Open Access)</h3>
                            <ul>
                                <li>Digital library of scriptures (with multiple translations and commentaries).</li>
                                <li>Video lectures by traditional scholars and academic experts.</li>
                                <li>Podcasts & interviews on Yoga, Ayurveda, Vedanta, Tantra, and Jyotisha.</li>
                            </ul>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">💬</div>
                            <h3>Interactive Learning & Community</h3>
                            <ul>
                                <li>Discussion forums for debates on Dharma, ethics, and modern applications.</li>
                                <li>Q&A sessions with scholars and gurus.</li>
                                <li>Study groups (e.g., Bhagavad Gita, Upanishads, or Sanskrit learning circles).</li>
                            </ul>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">🧘</div>
                            <h3>Resources for Beginners & Seekers</h3>
                            <ul>
                                <li>Simplified guides on core concepts (Karma, Dharma, Moksha, Bhakti).</li>
                                <li>Paths of Yoga (Bhakti, Jnana, Karma, Raja) explained in practical terms.</li>
                                <li>Temple traditions, rituals, and festivals decoded.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <div className="container">
                    <h2>Ensuring Authenticity & Depth</h2>
                    <ul>
                        <li>Collaboration with traditional acharyas and academic researchers to avoid misinterpretations.</li>
                        <li>Encouraging Sanskrit literacy for deeper engagement with original texts.</li>
                        <li>Cross-referencing ancient commentaries (Bhashyas) to maintain accuracy.</li>
                    </ul>

                    <h3>Modern Relevance & Outreach</h3>
                    <ul>
                        <li>Addressing contemporary issues (e.g., Hinduism and science, environmental Dharma, combating Hinduphobia).</li>
                        <li>Multilingual support (English, Hindi, Tamil, Sanskrit, etc.) for wider reach.</li>
                        <li>Social media presence with digestible, shareable content.</li>
                    </ul>
                </div>
            </section>

            <section id="join" className="sd-cta">
                <div className="container">
                    <h2>Join the Movement</h2>
                    <p>This platform thrives on community participation. Whether you are:</p>
                    <ul style={{ listStyle: 'none', margin: '1rem 0' }}>
                        <li>• A scholar researching Hindu texts,</li>
                        <li>• A practitioner seeking deeper understanding,</li>
                        <li>• Or a curious seeker exploring Dharma for the first time—</li>
                    </ul>
                    <p>Your voice matters.</p>

                    <div className="sd-cta-buttons">
                        <Link href="/contact" className="btn btn-primary">📖 Contribute articles</Link>
                        <Link href="/contact" className="btn">🎤 Suggest topics</Link>
                        <Link href="/contact" className="btn">💬 Join discussions</Link>
                    </div>

                    <p style={{ marginTop: '2rem' }}>Let's work together to preserve, explore, and share the eternal wisdom of Sanatan Dharma!</p>
                    <p><strong>Subscribe for updates & join our community today!</strong></p>
                </div>
            </section>
        </Layout>
    );
}

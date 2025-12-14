import Head from 'next/head';
import Layout from '../components/Layout';

export default function Programs() {
    return (
        <Layout>
            <Head>
                <title>Programs | Gurukulam</title>
            </Head>

            {/* Main Content */}
            <main>
                <section className="programs">
                    <div className="container">
                        <h2>Our Programs</h2>
                        <p className="section-description">Discover our comprehensive range of traditional learning programs.</p>

                        <div className="programs-grid">
                            <div className="program-card">
                                <div className="card-icon">
                                    <i className="fas fa-book-open"></i>
                                </div>
                                <h3>Vedic Studies</h3>
                                <p>Immerse yourself in the ancient wisdom of the Vedas through our comprehensive courses.</p>
                                <button className="button">Explore Program</button>
                            </div>

                            <div className="program-card">
                                <div className="card-icon">
                                    <i className="fas fa-language"></i>
                                </div>
                                <h3>Sanskrit Immersion</h3>
                                <p>Learn the divine language of Sanskrit through our immersive courses.</p>
                                <button className="button">Begin Journey</button>
                            </div>

                            <div className="program-card">
                                <div className="card-icon">
                                    <i className="fas fa-spa"></i>
                                </div>
                                <h3>Yoga & Meditation</h3>
                                <p>Experience the physical and spiritual benefits of traditional Yoga.</p>
                                <button className="button">Start Training</button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </Layout>
    );
}

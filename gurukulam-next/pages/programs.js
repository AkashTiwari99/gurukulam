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
                <section class="programs">
                    <div class="container">
                        <h2>Our Programs</h2>
                        <p class="section-description">Discover our comprehensive range of traditional learning programs.</p>

                        <div class="programs-grid">
                            <div class="program-card">
                                <div class="card-icon">
                                    <i class="fas fa-book-open"></i>
                                </div>
                                <h3>Vedic Studies</h3>
                                <p>Immerse yourself in the ancient wisdom of the Vedas through our comprehensive courses.</p>
                                <button class="button">Explore Program</button>
                            </div>

                            <div class="program-card">
                                <div class="card-icon">
                                    <i class="fas fa-language"></i>
                                </div>
                                <h3>Sanskrit Immersion</h3>
                                <p>Learn the divine language of Sanskrit through our immersive courses.</p>
                                <button class="button">Begin Journey</button>
                            </div>

                            <div class="program-card">
                                <div class="card-icon">
                                    <i class="fas fa-spa"></i>
                                </div>
                                <h3>Yoga & Meditation</h3>
                                <p>Experience the physical and spiritual benefits of traditional Yoga.</p>
                                <button class="button">Start Training</button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </Layout>
    );
}

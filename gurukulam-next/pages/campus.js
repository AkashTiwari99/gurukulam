import Head from 'next/head';
import Layout from '../components/Layout';
import Link from 'next/link';

export default function Campus() {
    return (
        <Layout>
            <Head>
                <title>Our Campus | Gurukulam</title>
            </Head>

            <section class="campus-hero">
                <div class="overlay"></div>
                <div class="container hero-container">
                    <div class="hero-content">
                        <h1 class="hero-title">Our Sacred Learning Space</h1>
                        <p class="hero-subtitle">Experience the tranquility of our traditional Gurukul campus.</p>
                    </div>
                </div>
            </section>

            <section class="campus-overview">
                <div class="container">
                    <div class="section-header">
                        <h2>Campus Overview</h2>
                        <p>A harmonious blend of traditional architecture and natural surroundings</p>
                    </div>
                    <div class="overview-content">
                        <div class="overview-text">
                            <p>Our Gurukulam campus is designed following ancient Vastu principles. Spread across 10 acres of lush greenery.</p>
                        </div>
                        <div class="overview-image">
                            <img src="/images/fire.jpg" alt="Gurukulam Campus Overview" />
                        </div>
                    </div>
                </div>
            </section>

            <section class="campus-facilities">
                <div class="container">
                    <div class="section-header">
                        <h2>Our Facilities</h2>
                    </div>
                    <div class="facilities-grid">
                        <div class="facility-card">
                            <div class="facility-icon"><i class="fas fa-home"></i></div>
                            <h3>Residential Quarters</h3>
                            <p>Simple, comfortable living spaces.</p>
                        </div>
                        <div class="facility-card">
                            <div class="facility-icon"><i class="fas fa-book"></i></div>
                            <h3>Learning Halls</h3>
                            <p>Traditional open halls (Shalas) with natural lighting.</p>
                        </div>
                        <div class="facility-card">
                            <div class="facility-icon"><i class="fas fa-pray"></i></div>
                            <h3>Meditation Spaces</h3>
                            <p>Dedicated areas for meditation.</p>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
}

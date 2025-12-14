import Head from 'next/head';
import Layout from '../components/Layout';
import Link from 'next/link';

export default function Mission() {
    return (
        <Layout>
            <Head>
                <title>Sanatan Dharma - Vision & Mission</title>
            </Head>

            <header className="vision-header">
                <div className="container header-content">
                    <h1>Our Vision & Mission</h1>
                    <p>Building bridges between ancient wisdom and modern scholarship</p>
                </div>
            </header>

            <section id="vision">
                <div className="container">
                    <h2>🌿 Vision</h2>
                    <p>To establish the world's most <strong>authentic, accessible, and interdisciplinary</strong> platform for
                        Sanatan Dharma—bridging ancient wisdom with modern scholarship to combat misinformation, preserve
                        endangered knowledge, and foster global understanding.</p>

                    <div className="why-matters">
                        <h3>Why This Matters:</h3>

                        <div className="data-point">
                            <h5>Oxford Centre for Hindu Studies (2021)</h5>
                            <p>67% of online content about Hinduism contains inaccuracies or oversimplifications.</p>
                        </div>

                        <div className="data-point">
                            <h5>UNESCO Report</h5>
                            <p>Less than 5% of Sanskrit manuscripts have been digitized or translated, risking permanent loss of
                                texts.</p>
                        </div>

                        <div className="data-point">
                            <h5>Pew Research (2023)</h5>
                            <p>While 80% of Hindus value traditional knowledge, only 12% have access to scholarly resources
                                beyond local temples.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section id="mission">
                <div className="container">
                    <h2>🎯 Mission</h2>
                    <p>Our mission is structured around <strong>three pillars</strong>, backed by data-driven strategies:</p>

                    <div className="mission-pillars">
                        <div className="pillar">
                            <div className="pillar-number">1</div>
                            <h3>Promote Evidence-Based Research</h3>
                            <h4>Goals:</h4>
                            <ul className="goals-list">
                                <li><strong>Peer-reviewed scholarship</strong>: Collaborate with institutions like BHU, IIT
                                    Kharagpur, and Harvard's Divinity School</li>
                                <li><strong>Scientific parallels</strong> in Vedic texts (e.g., NASA's acknowledgment of Surya
                                    Siddhanta's astronomical accuracy)</li>
                                <li><strong>Archaeological validation</strong> of Hindu civilizational sites (e.g., recent
                                    underwater discoveries of Dwarka)</li>
                                <li><strong>Fact-checking hub</strong> to counter misinformation</li>
                            </ul>
                            <div className="data-point">
                                <h5>JAAR Study (2022)</h5>
                                <p>Interdisciplinary research on Dharma increases public engagement by 300% compared to
                                    theological studies alone.</p>
                            </div>
                        </div>

                        <div className="pillar">
                            <div className="pillar-number">2</div>
                            <h3>Facilitate Respectful Dialogue</h3>
                            <h4>Goals:</h4>
                            <ul className="goals-list">
                                <li><strong>Global symposia</strong> with advocates, academics, and spiritual leaders</li>
                                <li><strong>Digital forums</strong> on contentious topics with moderated debates</li>
                                <li><strong>Youth outreach</strong> through Dharma campuses and student councils</li>
                            </ul>
                            <div className="data-point">
                                <h5>MIT Media Lab (2023)</h5>
                                <p>Structured interfaith dialogues reduce prejudice by 42% among participants.</p>
                            </div>
                        </div>

                        <div className="pillar">
                            <div className="pillar-number">3</div>
                            <h3>Build a Digital Library</h3>
                            <h4>Goals:</h4>
                            <ul className="goals-list">
                                <li><strong>Open-access repository</strong> of 10,000+ texts by 2030</li>
                                <li><strong>Multimedia archives</strong> of endangered oral traditions</li>
                                <li><strong>AI-powered tools</strong> for Sanskrit text analysis</li>
                            </ul>
                            <div className="data-point">
                                <h5>Internet Archive Data</h5>
                                <p>400% surge in downloads of Indic texts since 2020, signaling massive unmet demand.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="impact">
                <div className="container">
                    <div className="impact-section">
                        <h2>🌟 Strategic Impact</h2>
                        <p>By 2030, we aim to:</p>

                        <div className="impact-grid">
                            <div className="impact-item">
                                <div className="impact-icon">📜</div>
                                <h4>Train 1,000+ scholars</h4>
                                <p>In manuscript preservation (partnering with National Mission for Manuscripts)</p>
                            </div>

                            <div className="impact-item">
                                <div className="impact-icon">🌍</div>
                                <h4>Reach 5 million seekers</h4>
                                <p>Annually via multilingual content (prioritizing Hindi, Tamil, Bengali)</p>
                            </div>

                            <div className="impact-item">
                                <div className="impact-icon">🔍</div>
                                <h4>Top Google result</h4>
                                <p>For "Sanatan Dharma research" (SEO-optimized with 10,000+ backlinks)</p>
                            </div>
                        </div>
                    </div>

                    <div className="cta-section">
                        <p>Join us in this <strong>knowledge revolution</strong>—where every scripture decoded and every myth
                            dispelled strengthens Dharma for future generations.</p>
                        <Link href="/contact" className="cta-button">Become Part of Our Mission</Link>
                    </div>
                </div>
            </section>
        </Layout>
    );
}

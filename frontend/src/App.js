import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = "0x800528CC62833AE351FB4aC26dB3671B49177d35";

const CONTRACT_ABI = [
  "function createProfile(string memory _name, string memory _bio, string memory _skills) public",
  "function postJob(string memory _title, string memory _description, uint256 _paymentAmount) public payable returns (uint256)",
  "function acceptJob(uint256 _jobId) public",
  "function submitWork(uint256 _jobId) public",
  "function approveAndPay(uint256 _jobId, uint8 _rating, string memory _reviewText) public",
  "function getFreelancerProfile(address _freelancer) public view returns (tuple(address wallet, string name, string bio, string skills, uint256 totalJobsCompleted, uint256 totalEarned, uint256 reputationScore, bool isActive))",
  "function getAllAvailableJobs() public view returns (tuple(uint256 id, address client, address freelancer, string title, string description, uint256 paymentAmount, uint256 stakedAmount, uint8 status, uint256 createdAt, uint256 completedAt, uint8 rating, string reviewText)[])",
  "function getFreelancerJobs(address _freelancer) public view returns (uint256[])",
  "function getJob(uint256 _jobId) public view returns (tuple(uint256 id, address client, address freelancer, string title, string description, uint256 paymentAmount, uint256 stakedAmount, uint8 status, uint256 createdAt, uint256 completedAt, uint8 rating, string reviewText))",
  "function jobCounter() public view returns (uint256)",
  "function getReputationScore(address _freelancer) public view returns (uint256)"
];

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom right, #1a1a2e, #16213e, #0f3460)',
    color: 'white',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  header: {
    background: 'rgba(0,0,0,0.5)',
    borderBottom: '1px solid #9333ea',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  logoBox: {
    width: '40px',
    height: '40px',
    background: 'linear-gradient(to right, #9333ea, #ec4899)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '20px'
  },
  button: {
    background: 'linear-gradient(to right, #9333ea, #ec4899)',
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '16px'
  },
  accountBadge: {
    background: 'rgba(147, 51, 234, 0.3)',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px'
  },
  landing: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80vh',
    textAlign: 'center'
  },
  mainContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px'
  },
  tabs: {
    display: 'flex',
    gap: '16px',
    borderBottom: '1px solid #9333ea',
    marginBottom: '32px',
    overflowX: 'auto'
  },
  tab: {
    padding: '12px 24px',
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    fontWeight: 'bold',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    whiteSpace: 'nowrap'
  },
  tabActive: {
    padding: '12px 24px',
    background: 'none',
    border: 'none',
    color: '#c084fc',
    fontWeight: 'bold',
    cursor: 'pointer',
    borderBottom: '2px solid #9333ea',
    whiteSpace: 'nowrap'
  },
  card: {
    background: 'rgba(147, 51, 234, 0.1)',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #9333ea',
    marginBottom: '16px'
  },
  input: {
    width: '100%',
    padding: '12px',
    background: 'rgba(0,0,0,0.5)',
    border: '1px solid #9333ea',
    borderRadius: '8px',
    color: 'white',
    fontSize: '16px',
    marginBottom: '16px'
  },
  textarea: {
    width: '100%',
    padding: '12px',
    background: 'rgba(0,0,0,0.5)',
    border: '1px solid #9333ea',
    borderRadius: '8px',
    color: 'white',
    fontSize: '16px',
    marginBottom: '16px',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  statCard: {
    background: 'rgba(147, 51, 234, 0.3)',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #9333ea',
    textAlign: 'center'
  },
  jobCard: {
    background: 'rgba(147, 51, 234, 0.1)',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #9333ea',
    marginBottom: '16px'
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    display: 'inline-block',
    marginTop: '8px'
  },
  loading: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  spinner: {
    width: '64px',
    height: '64px',
    border: '4px solid #9333ea',
    borderTop: '4px solid transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }
};

export default function ReputationChain() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [profile, setProfile] = useState(null);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', bio: '', skills: '' });
  const [jobForm, setJobForm] = useState({ title: '', description: '', payment: '' });

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
        if (accounts.length > 0) connectWallet();
      });
    }
  }, []);

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          setAccount('');
          setContract(null);
          setProfile(null);
          setMyJobs([]);
          setAvailableJobs([]);
        } else if (accounts[0] !== account) {
          window.location.reload();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [account]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Install MetaMask!');
      return;
    }

    try {
      setLoading(true);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      setContract(contractInstance);

      await loadProfile(contractInstance, accounts[0]);
      await loadJobs(contractInstance, accounts[0]);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      alert('Error: ' + err.message);
    }
  };

  const disconnectWallet = () => {
    setAccount('');
    setContract(null);
    setProfile(null);
    setMyJobs([]);
    setAvailableJobs([]);
    setActiveTab('home');
  };

  const loadProfile = async (c, addr) => {
    try {
      const p = await c.getFreelancerProfile(addr);
      if (p.isActive) {
        setProfile({
          name: p.name,
          bio: p.bio,
          skills: p.skills,
          totalJobs: Number(p.totalJobsCompleted),
          totalEarned: ethers.formatEther(p.totalEarned),
          reputation: Number(p.reputationScore)
        });
      }
    } catch (e) { console.error(e); }
  };

  const loadJobs = async (c, addr) => {
    try {
      const available = await c.getAllAvailableJobs();
      setAvailableJobs(available.map(j => ({
        id: Number(j.id),
        title: j.title,
        desc: j.description,
        payment: ethers.formatEther(j.paymentAmount),
        client: j.client,
        freelancer: j.freelancer,
        status: Number(j.status)
      })));

      const myFreelancerJobIds = await c.getFreelancerJobs(addr);
      const myFreelancerJobs = await Promise.all(myFreelancerJobIds.map(id => c.getJob(id)));
      
      const allJobIds = [];
      const jobCounter = await c.jobCounter();
      for (let i = 1; i <= Number(jobCounter); i++) {
        allJobIds.push(i);
      }
      
      const allJobs = await Promise.all(allJobIds.map(id => c.getJob(id)));
      const myClientJobs = allJobs.filter(j => j.client.toLowerCase() === addr.toLowerCase());
      
      const combinedJobs = [...myFreelancerJobs, ...myClientJobs];
      const uniqueJobs = Array.from(new Map(combinedJobs.map(j => [Number(j.id), j])).values());
      
      setMyJobs(uniqueJobs.map(j => ({
        id: Number(j.id),
        title: j.title,
        desc: j.description,
        payment: ethers.formatEther(j.paymentAmount),
        client: j.client,
        freelancer: j.freelancer,
        status: Number(j.status),
        rating: Number(j.rating),
        reviewText: j.reviewText
      })));
    } catch (e) { 
      console.error(e); 
    }
  };

  const createProfile = async () => {
    if (!contract || !profileForm.name) return;
    try {
      setLoading(true);
      const tx = await contract.createProfile(profileForm.name, profileForm.bio, profileForm.skills);
      await tx.wait();
      await loadProfile(contract, account);
      setProfileForm({ name: '', bio: '', skills: '' });
      setActiveTab('profile');
      setLoading(false);
      alert('Profile created!');
    } catch (e) {
      setLoading(false);
      alert('Error: ' + e.message);
    }
  };

  const postJob = async () => {
    if (!contract || !jobForm.title) return;
    try {
      setLoading(true);
      const amt = ethers.parseEther(jobForm.payment);
      const tx = await contract.postJob(jobForm.title, jobForm.description, amt, { value: amt });
      await tx.wait();
      await loadJobs(contract, account);
      setJobForm({ title: '', description: '', payment: '' });
      setLoading(false);
      alert('Job posted!');
    } catch (e) {
      setLoading(false);
      alert('Error: ' + e.message);
    }
  };

  const acceptJob = async (id) => {
    if (!contract || !profile) {
      alert('Create profile first!');
      return;
    }
    try {
      setLoading(true);
      const tx = await contract.acceptJob(id);
      await tx.wait();
      await loadJobs(contract, account);
      setLoading(false);
      alert('Job accepted!');
    } catch (e) {
      setLoading(false);
      alert('Error: ' + e.message);
    }
  };

  const submitWork = async (id) => {
    if (!contract) return;
    try {
      setLoading(true);
      const tx = await contract.submitWork(id);
      await tx.wait();
      await loadJobs(contract, account);
      setLoading(false);
      alert('Work submitted!');
    } catch (e) {
      setLoading(false);
      alert('Error: ' + e.message);
    }
  };

  const approveWork = async (id) => {
    if (!contract) return;
    
    const rating = prompt('Rate the work (1-5):');
    if (!rating || rating < 1 || rating > 5) {
      alert('Please enter a rating between 1 and 5');
      return;
    }
    
    const review = prompt('Leave a review (optional):') || 'Good work!';
    
    try {
      setLoading(true);
      const tx = await contract.approveAndPay(id, parseInt(rating), review);
      await tx.wait();
      await loadJobs(contract, account);
      await loadProfile(contract, account);
      setLoading(false);
      alert('Payment released! Freelancer paid.');
    } catch (e) {
      setLoading(false);
      alert('Error: ' + e.message);
    }
  };

  const exportReputation = async () => {
    if (!contract || !profile) return;
    
    try {
      setLoading(true);
      const repScore = await contract.getReputationScore(account);
      
      const proof = {
        address: account,
        name: profile.name,
        reputation: Number(repScore),
        jobsCompleted: profile.totalJobs,
        totalEarned: profile.totalEarned + ' DEV',
        verificationUrl: `https://moonbase.moonscan.io/address/${account}`,
        contractAddress: CONTRACT_ADDRESS,
        network: 'Moonbase Alpha (Polkadot)',
        timestamp: new Date().toISOString(),
        message: 'This reputation is cryptographically verifiable on Polkadot blockchain'
      };
      
      const blob = new Blob([JSON.stringify(proof, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reputation-proof-${account.slice(0, 8)}.json`;
      a.click();
      
      setLoading(false);
      alert('Reputation proof exported! Share this file on any platform.');
    } catch (e) {
      setLoading(false);
      alert('Error: ' + e.message);
    }
  };

  const statusText = ['Posted', 'Accepted', 'In Progress', 'Submitted', 'Completed', 'Disputed', 'Cancelled'];
  const statusColors = ['#3b82f6', '#eab308', '#f97316', '#a855f7', '#22c55e', '#ef4444', '#6b7280'];

  return (
    <div style={styles.container}>
      <style>{`
        input::placeholder, textarea::placeholder { color: #9ca3af; }
        button:hover { opacity: 0.9; }
      `}</style>

      <div style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoBox}>RC</div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>ReputationChain</h1>
        </div>
        {account ? (
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={styles.accountBadge}>
              {account.slice(0, 6)}...{account.slice(-4)}
            </span>
            {profile && (
              <span style={{ ...styles.accountBadge, background: 'rgba(34, 197, 94, 0.3)' }}>
                Rep: {profile.reputation}
              </span>
            )}
            <button 
              onClick={disconnectWallet} 
              style={{ 
                ...styles.button, 
                background: '#ef4444',
                padding: '8px 16px',
                fontSize: '14px'
              }}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button onClick={connectWallet} style={styles.button}>Connect Wallet</button>
        )}
      </div>

      {!account ? (
        <div style={styles.landing}>
          <div>
            <h2 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '16px' }}>Own Your Work History</h2>
            <p style={{ fontSize: '20px', color: '#d1d5db', marginBottom: '32px' }}>Build portable reputation on Polkadot</p>
            <button onClick={connectWallet} style={{ ...styles.button, padding: '16px 32px', fontSize: '20px' }}>
              Get Started
            </button>
          </div>
        </div>
      ) : (
        <div style={styles.mainContent}>
          <div style={styles.tabs}>
            {['home', 'jobs', 'post', 'myJobs', 'profile'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={activeTab === tab ? styles.tabActive : styles.tab}
              >
                {tab === 'home' && '🏠 Home'}
                {tab === 'jobs' && '💼 Jobs'}
                {tab === 'post' && '➕ Post'}
                {tab === 'myJobs' && '📋 My Jobs'}
                {tab === 'profile' && '👤 Profile'}
              </button>
            ))}
          </div>

          {loading && (
            <div style={styles.loading}>
              <div style={{ background: '#581c87', padding: '32px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={styles.spinner}></div>
                <p style={{ fontSize: '20px', marginTop: '16px' }}>Processing...</p>
              </div>
            </div>
          )}

          {activeTab === 'home' && (
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>Dashboard</h2>
              {profile ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                  <div style={styles.statCard}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Jobs Done</h3>
                    <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#c084fc' }}>{profile.totalJobs}</p>
                  </div>
                  <div style={styles.statCard}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Total Earned</h3>
                    <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#4ade80' }}>{profile.totalEarned} DEV</p>
                  </div>
                  <div style={styles.statCard}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Reputation</h3>
                    <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#facc15' }}>{profile.reputation}</p>
                  </div>
                </div>
              ) : (
                <div style={{ ...styles.card, maxWidth: '600px', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid #eab308' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Create Profile</h3>
                  <input
                    type="text"
                    placeholder="Name"
                    value={profileForm.name}
                    onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                    style={styles.input}
                  />
                  <textarea
                    placeholder="Bio"
                    value={profileForm.bio}
                    rows="3"
                    onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })}
                    style={styles.textarea}
                  />
                  <input
                    type="text"
                    placeholder="Skills"
                    value={profileForm.skills}
                    onChange={e => setProfileForm({ ...profileForm, skills: e.target.value })}
                    style={styles.input}
                  />
                  <button onClick={createProfile} style={{ ...styles.button, width: '100%' }}>
                    Create Profile
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'jobs' && (
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>Available Jobs</h2>
              {availableJobs.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#9ca3af', padding: '32px' }}>No jobs available</p>
              ) : (
                availableJobs.map(job => (
                  <div key={job.id} style={styles.jobCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ fontSize: '24px', fontWeight: 'bold' }}>{job.title}</h3>
                        <p style={{ color: '#9ca3af', fontSize: '14px' }}>{job.client.slice(0, 10)}...</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#4ade80' }}>{job.payment} DEV</p>
                        <span style={{ ...styles.statusBadge, background: statusColors[job.status] }}>
                          {statusText[job.status]}
                        </span>
                      </div>
                    </div>
                    <p style={{ color: '#d1d5db', marginBottom: '16px' }}>{job.desc}</p>
                    <button
                      onClick={() => acceptJob(job.id)}
                      disabled={!profile}
                      style={{ ...styles.button, opacity: profile ? 1 : 0.5 }}
                    >
                      {profile ? 'Accept Job' : 'Create Profile First'}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'post' && (
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>Post Job</h2>
              <div style={{ ...styles.card, maxWidth: '600px' }}>
                <input
                  type="text"
                  placeholder="Job Title"
                  value={jobForm.title}
                  onChange={e => setJobForm({ ...jobForm, title: e.target.value })}
                  style={styles.input}
                />
                <textarea
                  placeholder="Description"
                  value={jobForm.description}
                  rows="5"
                  onChange={e => setJobForm({ ...jobForm, description: e.target.value })}
                  style={styles.textarea}
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Payment (DEV)"
                  value={jobForm.payment}
                  onChange={e => setJobForm({ ...jobForm, payment: e.target.value })}
                  style={styles.input}
                />
                <button onClick={postJob} style={{ ...styles.button, width: '100%' }}>
                  Post & Stake Payment
                </button>
              </div>
            </div>
          )}

          {activeTab === 'myJobs' && (
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>My Jobs</h2>
              {myJobs.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#9ca3af', padding: '32px' }}>No jobs yet</p>
              ) : (
                myJobs.map(job => {
                  const isClient = job.client && job.client.toLowerCase() === account.toLowerCase();
                  const isFreelancer = job.freelancer && job.freelancer.toLowerCase() === account.toLowerCase();
                  
                  return (
                    <div key={job.id} style={styles.jobCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div>
                          <h3 style={{ fontSize: '24px', fontWeight: 'bold' }}>{job.title}</h3>
                          <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                            {isClient ? `Freelancer: ${job.freelancer?.slice(0, 10)}...` : `Client: ${job.client?.slice(0, 10)}...`}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#4ade80' }}>{job.payment} DEV</p>
                          <span style={{ ...styles.statusBadge, background: statusColors[job.status] }}>
                            {statusText[job.status]}
                          </span>
                        </div>
                      </div>
                      <p style={{ color: '#d1d5db', marginBottom: '16px' }}>{job.desc}</p>
                      
                      {isFreelancer && job.status === 1 && (
                        <button onClick={() => submitWork(job.id)} style={{ ...styles.button, background: '#22c55e' }}>
                          Submit Work
                        </button>
                      )}
                      
                      {isClient && job.status === 3 && (
                        <div>
                          <p style={{ color: '#facc15', marginBottom: '12px', fontWeight: 'bold' }}>
                            ⏳ Work submitted - Review and approve payment
                          </p>
                          <button onClick={() => approveWork(job.id)} style={{ ...styles.button, background: '#3b82f6' }}>
                            Approve & Pay
                          </button>
                        </div>
                      )}
                      
                      {job.status === 4 && (
                        <div style={{ background: 'rgba(34, 197, 94, 0.2)', padding: '16px', borderRadius: '8px' }}>
                          <p style={{ fontWeight: 'bold' }}>✅ Completed! Rating: {'⭐'.repeat(job.rating)}</p>
                          {job.reviewText && (
                            <p style={{ color: '#d1d5db', marginTop: '8px', fontStyle: 'italic' }}>
                              "{job.reviewText}"
                            </p>
                          )}
                          
                          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', fontSize: '12px' }}>
                            <p style={{ fontWeight: 'bold', color: '#facc15', marginBottom: '8px' }}>
                              🔗 On-Chain Proof
                            </p>
                            <p style={{ marginBottom: '4px' }}>
                              <strong>Contract:</strong>{' '}
                              <a 
                                href={`https://moonbase.moonscan.io/address/${CONTRACT_ADDRESS}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#60a5fa', textDecoration: 'underline' }}
                              >
                                {CONTRACT_ADDRESS.slice(0, 10)}...{CONTRACT_ADDRESS.slice(-8)}
                              </a>
                            </p>
                            <p style={{ marginBottom: '4px' }}>
                              <strong>Job ID:</strong> #{job.id}
                            </p>
                            <p style={{ color: '#9ca3af', fontSize: '11px', marginTop: '8px' }}>
                              This reputation is stored on Polkadot's Moonbeam parachain. 
                              It's permanent, verifiable, and truly yours.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>Profile</h2>
              {profile ? (
                <div style={{ ...styles.card, maxWidth: '600px' }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>{profile.name}</h3>
                  <div style={{ color: '#d1d5db' }}>
                    <p style={{ marginBottom: '12px' }}><strong>Bio:</strong> {profile.bio}</p>
                    <p style={{ marginBottom: '12px' }}><strong>Skills:</strong> {profile.skills}</p>
                    <p style={{ marginBottom: '12px' }}><strong>Jobs:</strong> {profile.totalJobs}</p>
                    <p style={{ marginBottom: '12px' }}><strong>Earned:</strong> {profile.totalEarned} DEV</p>
                    <p><strong>Reputation:</strong> <span style={{ color: '#facc15', fontWeight: 'bold' }}>{profile.reputation}</span></p>
                  </div>
                  
                  <button 
                    onClick={exportReputation} 
                    style={{ 
                      ...styles.button, 
                      width: '100%', 
                      marginTop: '16px',
                      background: '#3b82f6'
                    }}
                  >
                    📥 Export Reputation Proof
                  </button>
                  
                  <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '8px', border: '1px solid #eab308' }}>
                    <p style={{ fontSize: '14px' }}>🔗 <strong>Portable Reputation</strong></p>
                    <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                      Your work history is on Polkadot. It follows you everywhere.
                    </p>
                  </div>
                </div>
              ) : (
                <p style={{ color: '#9ca3af' }}>No profile yet</p>
              )}
            </div>
          )}

          {/* Blockchain Info Footer */}
          <div style={{ marginTop: '60px', padding: '24px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid #9333ea' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              🔗 Blockchain Information
            </h3>
            <div style={{ fontSize: '14px', color: '#d1d5db' }}>
              <p style={{ marginBottom: '8px' }}>
                <strong>Network:</strong> Moonbase Alpha (Polkadot Testnet)
              </p>
              <p style={{ marginBottom: '8px' }}>
                <strong>Smart Contract:</strong>{' '}
                <a 
                  href={`https://moonbase.moonscan.io/address/${CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#60a5fa', textDecoration: 'underline' }}
                >
                  View on Moonscan
                </a>
              </p>
              <p style={{ marginBottom: '8px' }}>
                <strong>Technology:</strong> Solidity + Moonbeam (EVM Parachain)
              </p>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '12px' }}>
                All reputation data is stored on-chain and can be verified by anyone. 
                Your work history is permanent and portable across any platform.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
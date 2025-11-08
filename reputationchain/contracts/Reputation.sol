// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ReputationChain {
    
    struct Job {
        uint256 id;
        address client;
        address freelancer;
        string title;
        string description;
        uint256 paymentAmount;
        uint256 stakedAmount;
        JobStatus status;
        uint256 createdAt;
        uint256 completedAt;
        uint8 rating; // 1-5
        string reviewText;
    }
    
    enum JobStatus {
        Posted,      // Client posted, waiting for freelancer
        Accepted,    // Freelancer accepted
        InProgress,  // Work started
        Submitted,   // Freelancer submitted work
        Completed,   // Client approved, payment released
        Disputed,    // Either party raised dispute
        Cancelled    // Job cancelled
    }
    
    struct FreelancerProfile {
        address wallet;
        string name;
        string bio;
        string skills;
        uint256 totalJobsCompleted;
        uint256 totalEarned;
        uint256 reputationScore;
        bool isActive;
    }
    
    struct Dispute {
        uint256 jobId;
        address initiator;
        string reason;
        bool resolved;
        address winner;
    }
    
    // State variables
    uint256 public jobCounter;
    uint256 public platformFeePercent = 3; // 3% platform fee
    address public platformOwner;
    
    mapping(uint256 => Job) public jobs;
    mapping(address => FreelancerProfile) public freelancers;
    mapping(address => uint256[]) public freelancerJobs;
    mapping(address => uint256[]) public clientJobs;
    mapping(uint256 => Dispute) public disputes;
    
    // Events
    event JobPosted(uint256 indexed jobId, address indexed client, uint256 paymentAmount);
    event JobAccepted(uint256 indexed jobId, address indexed freelancer);
    event JobSubmitted(uint256 indexed jobId);
    event JobCompleted(uint256 indexed jobId, uint8 rating);
    event DisputeRaised(uint256 indexed jobId, address indexed initiator);
    event ProfileCreated(address indexed freelancer, string name);
    event PaymentReleased(uint256 indexed jobId, address indexed freelancer, uint256 amount);
    
    constructor() {
        platformOwner = msg.sender;
    }
    
    // Modifiers
    modifier onlyClient(uint256 _jobId) {
        require(jobs[_jobId].client == msg.sender, "Only client can call this");
        _;
    }
    
    modifier onlyFreelancer(uint256 _jobId) {
        require(jobs[_jobId].freelancer == msg.sender, "Only assigned freelancer can call this");
        _;
    }
    
    // Create freelancer profile
    function createProfile(string memory _name, string memory _bio, string memory _skills) public {
        require(!freelancers[msg.sender].isActive, "Profile already exists");
        
        freelancers[msg.sender] = FreelancerProfile({
            wallet: msg.sender,
            name: _name,
            bio: _bio,
            skills: _skills,
            totalJobsCompleted: 0,
            totalEarned: 0,
            reputationScore: 100, // Starting score
            isActive: true
        });
        
        emit ProfileCreated(msg.sender, _name);
    }
    
    // Update profile
    function updateProfile(string memory _bio, string memory _skills) public {
        require(freelancers[msg.sender].isActive, "Profile doesn't exist");
        freelancers[msg.sender].bio = _bio;
        freelancers[msg.sender].skills = _skills;
    }
    
    // Post a job (client stakes payment)
    function postJob(
        string memory _title,
        string memory _description,
        uint256 _paymentAmount
    ) public payable returns (uint256) {
        require(msg.value >= _paymentAmount, "Must stake payment amount");
        
        jobCounter++;
        
        jobs[jobCounter] = Job({
            id: jobCounter,
            client: msg.sender,
            freelancer: address(0),
            title: _title,
            description: _description,
            paymentAmount: _paymentAmount,
            stakedAmount: msg.value,
            status: JobStatus.Posted,
            createdAt: block.timestamp,
            completedAt: 0,
            rating: 0,
            reviewText: ""
        });
        
        clientJobs[msg.sender].push(jobCounter);
        
        emit JobPosted(jobCounter, msg.sender, _paymentAmount);
        return jobCounter;
    }
    
    // Freelancer accepts job
    function acceptJob(uint256 _jobId) public {
        Job storage job = jobs[_jobId];
        require(job.status == JobStatus.Posted, "Job not available");
        require(freelancers[msg.sender].isActive, "Must have active profile");
        
        job.freelancer = msg.sender;
        job.status = JobStatus.Accepted;
        
        freelancerJobs[msg.sender].push(_jobId);
        
        emit JobAccepted(_jobId, msg.sender);
    }
    
    // Freelancer submits completed work
    function submitWork(uint256 _jobId) public onlyFreelancer(_jobId) {
        Job storage job = jobs[_jobId];
        require(job.status == JobStatus.Accepted || job.status == JobStatus.InProgress, "Invalid job status");
        
        job.status = JobStatus.Submitted;
        emit JobSubmitted(_jobId);
    }
    
    // Client approves work and releases payment
    function approveAndPay(uint256 _jobId, uint8 _rating, string memory _reviewText) public onlyClient(_jobId) {
        Job storage job = jobs[_jobId];
        require(job.status == JobStatus.Submitted, "Work not submitted yet");
        require(_rating >= 1 && _rating <= 5, "Rating must be 1-5");
        
        job.status = JobStatus.Completed;
        job.completedAt = block.timestamp;
        job.rating = _rating;
        job.reviewText = _reviewText;
        
        // Calculate platform fee
        uint256 platformFee = (job.paymentAmount * platformFeePercent) / 100;
        uint256 freelancerPayment = job.paymentAmount - platformFee;
        
        // Update freelancer stats
        FreelancerProfile storage profile = freelancers[job.freelancer];
        profile.totalJobsCompleted++;
        profile.totalEarned += freelancerPayment;
        profile.reputationScore += (_rating * 10); // Simple reputation calculation
        
        // Transfer payments
        payable(job.freelancer).transfer(freelancerPayment);
        payable(platformOwner).transfer(platformFee);
        
        // Refund any extra staked amount
        if (job.stakedAmount > job.paymentAmount) {
            payable(job.client).transfer(job.stakedAmount - job.paymentAmount);
        }
        
        emit JobCompleted(_jobId, _rating);
        emit PaymentReleased(_jobId, job.freelancer, freelancerPayment);
    }
    
    // Raise dispute
    function raiseDispute(uint256 _jobId, string memory _reason) public {
        Job storage job = jobs[_jobId];
        require(
            msg.sender == job.client || msg.sender == job.freelancer,
            "Only client or freelancer can raise dispute"
        );
        require(
            job.status == JobStatus.Submitted || job.status == JobStatus.InProgress,
            "Invalid status for dispute"
        );
        
        job.status = JobStatus.Disputed;
        
        disputes[_jobId] = Dispute({
            jobId: _jobId,
            initiator: msg.sender,
            reason: _reason,
            resolved: false,
            winner: address(0)
        });
        
        emit DisputeRaised(_jobId, msg.sender);
    }
    
    // Simple dispute resolution (for MVP - platform owner decides)
    function resolveDispute(uint256 _jobId, bool _favorFreelancer) public {
        require(msg.sender == platformOwner, "Only platform owner can resolve disputes");
        
        Job storage job = jobs[_jobId];
        Dispute storage dispute = disputes[_jobId];
        
        require(job.status == JobStatus.Disputed, "Job not in dispute");
        require(!dispute.resolved, "Dispute already resolved");
        
        dispute.resolved = true;
        
        if (_favorFreelancer) {
            dispute.winner = job.freelancer;
            // Release payment to freelancer
            uint256 platformFee = (job.paymentAmount * platformFeePercent) / 100;
            uint256 freelancerPayment = job.paymentAmount - platformFee;
            
            payable(job.freelancer).transfer(freelancerPayment);
            payable(platformOwner).transfer(platformFee);
            
            job.status = JobStatus.Completed;
        } else {
            dispute.winner = job.client;
            // Refund client
            payable(job.client).transfer(job.stakedAmount);
            job.status = JobStatus.Cancelled;
        }
    }
    
    // Cancel job (only if not accepted yet)
    function cancelJob(uint256 _jobId) public onlyClient(_jobId) {
        Job storage job = jobs[_jobId];
        require(job.status == JobStatus.Posted, "Can only cancel unaccepted jobs");
        
        job.status = JobStatus.Cancelled;
        payable(job.client).transfer(job.stakedAmount);
    }
    
    // View functions
    function getFreelancerProfile(address _freelancer) public view returns (FreelancerProfile memory) {
        return freelancers[_freelancer];
    }
    
    function getJob(uint256 _jobId) public view returns (Job memory) {
        return jobs[_jobId];
    }
    
    function getFreelancerJobs(address _freelancer) public view returns (uint256[] memory) {
        return freelancerJobs[_freelancer];
    }
    
    function getClientJobs(address _client) public view returns (uint256[] memory) {
        return clientJobs[_client];
    }
    
    function getAllAvailableJobs() public view returns (Job[] memory) {
        uint256 availableCount = 0;
        
        // Count available jobs
        for (uint256 i = 1; i <= jobCounter; i++) {
            if (jobs[i].status == JobStatus.Posted) {
                availableCount++;
            }
        }
        
        // Create array of available jobs
        Job[] memory availableJobs = new Job[](availableCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= jobCounter; i++) {
            if (jobs[i].status == JobStatus.Posted) {
                availableJobs[index] = jobs[i];
                index++;
            }
        }
        
        return availableJobs;
    }
    
    // Get reputation score (public view for cross-platform verification)
    function getReputationScore(address _freelancer) public view returns (uint256) {
        return freelancers[_freelancer].reputationScore;
    }
}
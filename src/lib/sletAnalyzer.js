export class STSAssessmentEngine {
  constructor(patientBaselineFSR = 500) {
    this.baselineFSR = patientBaselineFSR;
    this.isActive = false; 
    this.isAscending = false;
    this.ascentDataWindow = [];
    
    // Session Data
    this.sessionReps = [];
    this.targetReps = 5; // Standard 5xSTS Test
    
    // Medical standard thresholds
    this.THRESHOLDS = {
      WOBBLE_VARIANCE: 15.0, // Degrees of pitch variance (compensation)
      FSR_DEVIATION: 0.20,   // 20% deviation from healthy baseline
      START_ANGLE: 40.0,     // Knee angle indicating sitting
      END_ANGLE: 20.0        // Knee angle indicating standing
    };
  }

  startSession() {
    this.isActive = true;
    this.sessionReps = [];
    this.isAscending = false;
    this.ascentDataWindow = [];
    return { status: "STARTED", repsCompleted: 0, target: this.targetReps };
  }

  stopSession() {
    this.isActive = false;
    return { status: "STOPPED", repsCompleted: this.sessionReps.length };
  }

  _calculateVariance(array) {
    if (array.length === 0) return 0;
    const mean = array.reduce((a, b) => a + b) / array.length;
    return array.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / array.length;
  }

  processTelemetry(payload) {
    if (!this.isActive) return null; // Ignore data if test isn't running

    const angle = parseFloat(payload.angle);
    const fsr = parseFloat(payload.fsr);
    const thighPitch = parseFloat(payload.thigh_pitch);
    const shankPitch = parseFloat(payload.shank_pitch);

    // 1. Detect Ascent Start
    if (!this.isAscending && angle > this.THRESHOLDS.START_ANGLE) {
       this.isAscending = true;
       this.ascentDataWindow = []; 
    }

    // 2. Record Ascent
    if (this.isAscending) {
      this.ascentDataWindow.push({ angle, fsr, thighPitch, shankPitch });

      // 3. Detect Ascent End
      if (angle < this.THRESHOLDS.END_ANGLE) {
        this.isAscending = false;
        return this.analyzeRepetition();
      }
    }

    return { event: "TEST_IN_PROGRESS", repsCompleted: this.sessionReps.length }; 
  }

  analyzeRepetition() {
    if (this.ascentDataWindow.length < 5) return null;

    const fsrValues = this.ascentDataWindow.map(d => d.fsr);
    const thighPitches = this.ascentDataWindow.map(d => d.thighPitch);
    const shankPitches = this.ascentDataWindow.map(d => d.shankPitch);

    const totalWobble = this._calculateVariance(thighPitches) + this._calculateVariance(shankPitches);
    const avgFSR = fsrValues.reduce((a, b) => a + b) / fsrValues.length;
    const fsrDeviation = Math.abs((avgFSR - this.baselineFSR) / this.baselineFSR);

    const isAbnormal = totalWobble > this.THRESHOLDS.WOBBLE_VARIANCE || fsrDeviation > this.THRESHOLDS.FSR_DEVIATION;

    this.sessionReps.push({ totalWobble, fsrDeviation, isAbnormal });

    if (this.sessionReps.length >= this.targetReps) {
      this.isActive = false; // Auto-stop test
      const abnormalCount = this.sessionReps.filter(r => r.isAbnormal).length;
      
      return {
        event: "TEST_COMPLETE",
        summary: {
          totalReps: this.targetReps,
          abnormalMechanics: abnormalCount,
          passed: abnormalCount < 3, // Requires 3 out of 5 to fail to trigger high risk
          averageWobble: (this.sessionReps.reduce((sum, r) => sum + r.totalWobble, 0) / this.targetReps).toFixed(2),
        }
      };
    }

    return { 
      event: "REP_COMPLETED", 
      repsCompleted: this.sessionReps.length,
      latestRepAbnormal: isAbnormal
    };
  }
}
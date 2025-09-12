const express = require('express');
const router = express.Router();
const db = require('./db');
const auth = require('./middleware/auth');

// Get all cases
router.get('/', auth, async (req, res) => {
  try {
    // Check if this is a name uniqueness validation request
    if (req.query.checkName === 'true' && req.query.firstName && req.query.lastName) {
      // This is a name check request
      const existingCase = await db.query(
        'SELECT * FROM cases WHERE LOWER(first_name) = LOWER($1) AND LOWER(last_name) = LOWER($2)',
        [req.query.firstName, req.query.lastName]
      );
      
      return res.json({ 
        exists: existingCase.rows.length > 0,
        message: existingCase.rows.length > 0 ? 
          'A case with this name already exists in the system.' : 
          'Name is unique and available for use.'
      });
    }
    
    // Normal case listing flow
    const result = await db.query(
      'SELECT id, first_name, last_name, middle_name, sex, birthdate, program_type, last_updated FROM cases ORDER BY created_at DESC'
    );
    
    // Format the data for the frontend
    const cases = result.rows.map(caseItem => ({
      id: caseItem.id,
      name: `${caseItem.first_name} ${caseItem.last_name}`,
      age: calculateAge(caseItem.birthdate),
      programType: caseItem.program_type,
      lastUpdated: formatDate(caseItem.last_updated || caseItem.created_at)
    }));
    
    res.json(cases);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get case by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM cases WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create a new case
router.post('/', auth, async (req, res) => {
  try {
    const {
      firstName, lastName, middleName, sex, birthdate, status, religion,
      address, sourceOfReferral, caseType, assignedHouseParent, programType, program_type,
      problemPresented, briefHistory, economicSituation, medicalHistory,
      familyBackground, agencies, checklist, recommendation, assessment
    } = req.body;
    
    // Check if a case with the same name already exists
    const existingCase = await db.query(
      'SELECT * FROM cases WHERE LOWER(first_name) = LOWER($1) AND LOWER(last_name) = LOWER($2)',
      [firstName, lastName]
    );
    
    if (existingCase.rows.length > 0) {
      return res.status(400).json({ 
        message: 'A case with this name already exists. Please use a different name or update the existing case.'
      });
    }
    
    // Use program_type if provided, otherwise use caseType, and only fallback to Blessed Rosalie Rendu if neither exists
    const actualProgramType = program_type || programType || caseType || 'Blessed Rosalie Rendu';
    
    const result = await db.query(
      `INSERT INTO cases (
        first_name, last_name, middle_name, sex, birthdate, status, religion,
        address, source_of_referral, case_type, assigned_house_parent, program_type,
        problem_presented, brief_history, economic_situation, medical_history,
        family_background, checklist, recommendation, assessment, last_updated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) RETURNING *`,
      [
        firstName, lastName, middleName, sex, birthdate, status, religion,
        address, sourceOfReferral, caseType, assignedHouseParent, actualProgramType,
        problemPresented, briefHistory, economicSituation, medicalHistory,
        familyBackground, JSON.stringify(checklist || []), recommendation, assessment || '', new Date()
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update a case
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName, lastName, middleName, sex, birthdate, status, religion,
      address, sourceOfReferral, caseType, assignedHouseParent, programType, program_type,
      problemPresented, briefHistory, economicSituation, medicalHistory,
      familyBackground, checklist, recommendation, assessment
    } = req.body;
    
    // Check if the case exists
    const existingCase = await db.query('SELECT * FROM cases WHERE id = $1', [id]);
    
    if (existingCase.rows.length === 0) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    // Check if another case with the same name exists (excluding the current case being updated)
    const duplicateCheck = await db.query(
      'SELECT * FROM cases WHERE LOWER(first_name) = LOWER($1) AND LOWER(last_name) = LOWER($2) AND id != $3',
      [firstName, lastName, id]
    );
    
    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({ 
        message: 'Another case with this name already exists. Case names must be unique.'
      });
    }
    
    // Use program_type if provided, otherwise use programType, caseType, and only fall back to default as last resort
    const actualProgramType = program_type || programType || caseType;
    
    console.log("Update case - Program type received:", { programType, program_type, caseType, actualProgramType });
    
    const result = await db.query(
      `UPDATE cases SET
        first_name = $1, last_name = $2, middle_name = $3, sex = $4, birthdate = $5,
        status = $6, religion = $7, address = $8, source_of_referral = $9,
        case_type = $10, assigned_house_parent = $11, program_type = $12,
        problem_presented = $13, brief_history = $14, economic_situation = $15,
        medical_history = $16, family_background = $17, checklist = $18,
        recommendation = $19, assessment = $20,
        updated_at = CURRENT_TIMESTAMP, last_updated = $21
        WHERE id = $22 RETURNING *`,
      [
        firstName, lastName, middleName, sex, birthdate, status, religion,
        address, sourceOfReferral, caseType, assignedHouseParent, actualProgramType,
        problemPresented, briefHistory, economicSituation, medicalHistory,
        familyBackground, JSON.stringify(checklist || []), recommendation, assessment || '',
        new Date(), id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Helper functions
function calculateAge(birthdate) {
  if (!birthdate) return '';
  const today = new Date();
  const birthDate = new Date(birthdate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function formatDate(date) {
  if (!date) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(date).toLocaleDateString('en-US', options);
}

// DELETE a case by ID
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if case exists
    const caseExists = await db.query(
      'SELECT * FROM cases WHERE id = $1',
      [id]
    );
    
    if (caseExists.rows.length === 0) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    // Delete the case
    await db.query(
      'DELETE FROM cases WHERE id = $1',
      [id]
    );
    
    res.json({ message: 'Case deleted successfully' });
  } catch (err) {
    console.error('Error deleting case:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
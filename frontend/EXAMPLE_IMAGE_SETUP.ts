// 🚀 EXAMPLE: How to add your first category image

// Step 1: Place your image files in assets/images/categories/
// For example: company-icon.png

// Step 2: Import the image at the top of dashboard.tsx
// Add this line after the existing imports:
// import CompanyIcon from '../assets/images/categories/company-icon.png';

// Step 3: Update the categories array
// Change this:
/*
{ 
  name: 'Company', 
  image: null, 
  color: '#E3F2FD',
  placeholder: '🏢'
}
*/

// To this:
/*
{ 
  name: 'Company', 
  image: CompanyIcon, 
  color: '#E3F2FD',
  placeholder: '🏢'
}
*/

// Step 4: Test it!
// The image will automatically replace the emoji placeholder

// 💡 Pro Tips:
// - Keep images small (under 50KB each)
// - Use consistent style across all category icons
// - Test on both light and dark themes
// - Consider accessibility (icons should be recognizable)

export {}; // This makes it a module
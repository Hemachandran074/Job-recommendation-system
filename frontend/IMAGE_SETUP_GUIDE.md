# 📱 How to Add Category Images to Dashboard

## 📁 Step 1: Add Your Images to Assets

1. Create the following folder structure (if it doesn't exist):
   ```
   frontend/jobfinder/assets/images/categories/
   ```

2. Add your category images to this folder:
   ```
   assets/images/categories/
   ├── company-icon.png
   ├── fulltime-icon.png
   ├── parttime-icon.png
   └── internship-icon.png
   ```

## 🔧 Step 2: Import Images in Dashboard

In `app/dashboard.tsx`, replace the TODO comments with actual imports:

```typescript
// Replace the TODO section (lines 10-13) with:
import CompanyIcon from '../assets/images/categories/company-icon.png';
import FullTimeIcon from '../assets/images/categories/fulltime-icon.png';
import PartTimeIcon from '../assets/images/categories/parttime-icon.png';
import InternshipIcon from '../assets/images/categories/internship-icon.png';
```

## 📝 Step 3: Update Categories Array

In the `categories` array (around line 35), replace the `image: null` with your imported images:

```typescript
const categories = [
  { 
    name: 'Company', 
    image: CompanyIcon,  // Changed from: image: null,
    color: '#E3F2FD',
    placeholder: '🏢'
  },
  { 
    name: 'Full Time', 
    image: FullTimeIcon,  // Changed from: image: null,
    color: '#F3E5F5',
    placeholder: '💼'
  },
  { 
    name: 'Part Time', 
    image: PartTimeIcon,  // Changed from: image: null,
    color: '#E8F5E8',
    placeholder: '⏰'
  },
  { 
    name: 'Internship', 
    image: InternshipIcon,  // Changed from: image: null,
    color: '#FFF3E0',
    placeholder: '🎓'
  }
];
```

## 🎨 Recommended Image Specifications

- **Format**: PNG or SVG (PNG recommended for React Native)
- **Size**: 24x24 pixels or 48x48 pixels (for retina displays)
- **Style**: Simple, minimalist icons that work well on colored backgrounds
- **Colors**: Preferably monochrome or simple 2-color designs

## 🔄 Current Fallback Behavior

Until you add real images, the dashboard will show emoji placeholders:
- Company: 🏢
- Full Time: 💼 
- Part Time: ⏰
- Internship: 🎓

## ✅ Testing

After adding your images:
1. Restart the Expo development server
2. Check that images load correctly
3. Verify they look good on different screen sizes
4. Test both light and colored backgrounds

## 💡 Alternative: Using Icon Libraries

If you prefer using icon libraries instead of custom images, you can replace the image logic with:

```typescript
// Option 1: Expo Icons
import { MaterialIcons } from '@expo/vector-icons';

// Option 2: React Native Vector Icons
import Icon from 'react-native-vector-icons/MaterialIcons';

// Then update the rendering to use icons instead of images
```

## 🚨 Troubleshooting

**Images not showing?**
- Check file paths are correct
- Ensure image files are in the assets folder
- Restart Expo development server
- Check console for import errors

**Images look blurry?**
- Use higher resolution images (48x48 or 72x72)
- Use vector formats (SVG) if supported
- Check image compression quality
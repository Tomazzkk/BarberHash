import { useEffect } from 'react';
import { useSessionStore } from '@/hooks/useSessionStore';

const GoogleAnalyticsTracker = () => {
  const config = useSessionStore((state) => state.config);
  const gaId = config?.ga4_measurement_id;

  useEffect(() => {
    if (gaId) {
      // Add the Google Analytics script
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      script1.id = 'ga-script-1';
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.id = 'ga-script-2';
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId}');
      `;
      document.head.appendChild(script2);

      // Cleanup function to remove scripts when component unmounts or gaId changes
      return () => {
        const s1 = document.getElementById('ga-script-1');
        const s2 = document.getElementById('ga-script-2');
        if (s1) document.head.removeChild(s1);
        if (s2) document.head.removeChild(s2);
      };
    }
  }, [gaId]);

  return null; // This component does not render anything
};

export default GoogleAnalyticsTracker;
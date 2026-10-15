"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function AutoLogout() {
  const pathname = usePathname();

  useEffect(() => {
    // Huwag paganahin ang auto-logout kung nasa Login o Register page na ang user
    if (pathname === '/login' || pathname === '/register') return;

    let timeoutId: NodeJS.Timeout;

    // Ito ang function na magbubura ng session at magbabalik sa login
    const handleLogout = () => {
      console.warn("User has been idle. Logging out automatically for security...");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      document.cookie = "clinic_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/login";
    };

    // Ire-reset nito ang timer pabalik sa zero kapag gumalaw ang user
    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      
      // Nakaset sa 15 minutes (15 * 60 * 1000 = 900,000 milliseconds)
      // Tip: Kung gusto mong i-test kung gumagana agad, palitan mo muna ng 10000 (10 seconds)
      timeoutId = setTimeout(handleLogout, 15 * 60 * 1000); 
    };

    // Mga actions na binabantayan natin (mouse galaw, click, type, scroll)
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];

    // Simulan ang timer
    resetTimer();

    // Ikabit ang mga "listeners" sa buong website
    events.forEach(event => window.addEventListener(event, resetTimer));

    // Cleanup function kapag umalis sa page
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [pathname]);

  return null; // Wala itong ipapakitang UI dahil background timer lang ito
}
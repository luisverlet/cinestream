import { useEffect, useCallback } from 'preact/hooks';

interface SpatialNavOptions {
  active?: boolean;
  onBack?: () => void;
  containerSelector?: string;
}

export function useSpatialNav(options: SpatialNavOptions = {}) {
  const { active = true, onBack, containerSelector } = options;

  const getNavItems = useCallback((): HTMLElement[] => {
    const root = containerSelector
      ? document.querySelector(containerSelector) || document.body
      : document.body;

    const selector = '[data-nav="item"]:not([disabled]):not([aria-hidden="true"]), button:not([disabled]):not([data-nav-ignore]), a:not([disabled]):not([data-nav-ignore]), input:not([disabled]):not([data-nav-ignore])';
    const elements = Array.from(root.querySelectorAll<HTMLElement>(selector));

    // Only return visible elements with non-zero dimensions
    return elements.filter(el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.visibility !== 'hidden' &&
        style.display !== 'none'
      );
    });
  }, [containerSelector]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!active) return;

    const key = e.key;
    const keyCode = e.keyCode;

    // Detect if user is currently typing in an input, textarea or contentEditable
    const activeEl = document.activeElement;
    const isTextInput =
      activeEl instanceof HTMLInputElement ||
      activeEl instanceof HTMLTextAreaElement ||
      (activeEl as HTMLElement)?.isContentEditable;

    // If typing in any input field:
    if (isTextInput) {
      // NEVER intercept Backspace, Delete or cursor arrow keys while typing
      if (key === 'Backspace' || key === 'Delete' || key === 'ArrowLeft' || key === 'ArrowRight') {
        return;
      }

      // Enter inside an input should let the form submit or natural behavior execute
      if (key === 'Enter') {
        return;
      }

      // Escape or dedicated remote Back buttons (webOS 461, Tizen 10009) unfocus input and trigger onBack
      if (key === 'Escape' || keyCode === 461 || keyCode === 10009) {
        (activeEl as HTMLElement).blur();
        if (onBack) {
          e.preventDefault();
          onBack();
        }
        return;
      }

      // Only allow ArrowUp / ArrowDown to navigate away from the input
      if (key !== 'ArrowUp' && key !== 'ArrowDown') {
        return;
      }
    } else {
      // Non-input elements: remote back buttons (Escape, Backspace, webOS 461, Tizen 10009)
      const isBackKey = key === 'Escape' || key === 'Backspace' || keyCode === 461 || keyCode === 10009;
      if (isBackKey) {
        if (onBack) {
          e.preventDefault();
          onBack();
          return;
        }
      }
    }

    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(key)) {
      return;
    }

    const items = getNavItems();
    if (items.length === 0) return;

    const current = (document.activeElement as HTMLElement) || null;

    if (key === 'Enter') {
      if (current && items.includes(current) && !(current instanceof HTMLInputElement)) {
        // Let natural click happen or trigger it for buttons, cards, links
        current.click();
      }
      return;
    }

    e.preventDefault();

    // If nothing currently focused, focus first item or default
    if (!current || !items.includes(current)) {
      const defaultItem = items.find(el => el.getAttribute('data-nav-default') === 'true') || items[0];
      if (defaultItem) {
        defaultItem.focus();
        defaultItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
      return;
    }

    const currentRect = current.getBoundingClientRect();
    const currentCenter = {
      x: currentRect.left + currentRect.width / 2,
      y: currentRect.top + currentRect.height / 2
    };

    let bestCandidate: HTMLElement | null = null;
    let minDistance = Infinity;

    for (const item of items) {
      if (item === current) continue;

      const rect = item.getBoundingClientRect();
      const center = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      const dx = center.x - currentCenter.x;
      const dy = center.y - currentCenter.y;

      // Check if candidate is strictly in the direction of the pressed arrow key
      let isDirectionValid = false;
      let primaryDiff = 0;
      let secondaryDiff = 0;

      switch (key) {
        case 'ArrowRight':
          if (dx > 5) {
            isDirectionValid = true;
            primaryDiff = dx;
            secondaryDiff = Math.abs(dy);
          }
          break;
        case 'ArrowLeft':
          if (dx < -5) {
            isDirectionValid = true;
            primaryDiff = Math.abs(dx);
            secondaryDiff = Math.abs(dy);
          }
          break;
        case 'ArrowDown':
          if (dy > 5) {
            isDirectionValid = true;
            primaryDiff = dy;
            secondaryDiff = Math.abs(dx);
          }
          break;
        case 'ArrowUp':
          if (dy < -5) {
            isDirectionValid = true;
            primaryDiff = Math.abs(dy);
            secondaryDiff = Math.abs(dx);
          }
          break;
      }

      if (!isDirectionValid) continue;

      // Distance metric: prioritize movement along primary axis, heavily penalize deviation on cross axis
      const distance = primaryDiff + (secondaryDiff * 2.5);

      if (distance < minDistance) {
        minDistance = distance;
        bestCandidate = item;
      }
    }

    if (bestCandidate) {
      bestCandidate.focus();
      bestCandidate.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [active, onBack, getNavItems]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const focusFirst = useCallback(() => {
    setTimeout(() => {
      const items = getNavItems();
      const defaultItem = items.find(el => el.getAttribute('data-nav-default') === 'true') || items[0];
      if (defaultItem) {
        defaultItem.focus();
        defaultItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }, 50);
  }, [getNavItems]);

  return { focusFirst };
}


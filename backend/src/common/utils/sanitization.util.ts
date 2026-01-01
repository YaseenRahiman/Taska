import { Injectable } from '@nestjs/common';

@Injectable()
export class SanitizationUtil {
  /**
   * Sanitize HTML input to prevent XSS attacks
   */
  static sanitizeHtml(input: string): string {
    if (!input) return input;
    
    // Basic HTML entity encoding to prevent XSS
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Sanitize SQL input to prevent SQL injection
   */
  static sanitizeSQL(input: string): string {
    if (!input) return input;
    
    // Remove potential SQL injection characters
    return input
      .replace(/['";\\]/g, '')
      .replace(/--/g, '')
      .replace(/\/\*.*?\*\//g, '')
      .replace(/\bUNION\b/gi, '')
      .replace(/\bSELECT\b/gi, '')
      .replace(/\bINSERT\b/gi, '')
      .replace(/\bUPDATE\b/gi, '')
      .replace(/\bDELETE\b/gi, '')
      .replace(/\bDROP\b/gi, '');
  }

  /**
   * Sanitize general user input
   */
  static sanitizeInput(input: string): string {
    if (!input) return input;
    
    return input.trim()
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  }

  /**
   * Validate and sanitize email
   */
  static sanitizeEmail(email: string): string {
    if (!email) return email;
    
    return email.toLowerCase().trim();
  }

  /**
   * Sanitize phone number (South African format)
   */
  static sanitizePhoneNumber(phone: string): string {
    if (!phone) return phone;
    
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Handle South African numbers
    if (cleaned.startsWith('0')) {
      return '+27' + cleaned.substring(1);
    } else if (cleaned.startsWith('27')) {
      return '+' + cleaned;
    } else if (cleaned.startsWith('+27')) {
      return cleaned;
    }
    
    return cleaned;
  }

  /**
   * Sanitize search query
   */
  static sanitizeSearchQuery(query: string): string {
    if (!query) return query;
    
    return query.trim()
      .replace(/[<>'"]/g, '') // Remove dangerous characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 100); // Limit length
  }

  /**
   * Sanitize file name
   */
  static sanitizeFileName(fileName: string): string {
    if (!fileName) return fileName;
    
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .substring(0, 255); // Limit length
  }

  /**
   * Rate limiting key sanitization
   */
  static sanitizeRateLimitKey(key: string): string {
    if (!key) return key;
    
    return key.replace(/[^a-zA-Z0-9:.-]/g, '').substring(0, 100);
  }
}

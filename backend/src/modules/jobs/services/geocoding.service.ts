import { Injectable, BadRequestException } from '@nestjs/common';
import { LoggingService } from '../../../common/logging/logging.service';

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  city?: string;
  province?: string;
  postalCode?: string;
}

@Injectable()
export class GeocodingService {
  constructor(private readonly logger: LoggingService) {}

  async geocodeAddress(
    addressLine1: string,
    addressLine2?: string,
    city?: string,
    province?: string,
    postalCode?: string,
  ): Promise<GeocodeResult> {
    try {
      // For now, return mock coordinates for South African locations
      // In a real implementation, this would use Google Maps API or similar
      const mockCoordinates = this.getMockCoordinates(city || 'Cape Town');
      
      const formattedAddress = [
        addressLine1,
        addressLine2,
        city,
        province,
        postalCode,
      ]
        .filter(Boolean)
        .join(', ');

      return {
        latitude: mockCoordinates.lat,
        longitude: mockCoordinates.lng,
        formattedAddress,
        city,
        province,
        postalCode,
      };
    } catch (error) {
      this.logger.error('Geocoding failed', error);
      throw new BadRequestException('Unable to geocode address');
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodeResult> {
    try {
      // Mock reverse geocoding for South African coordinates
      const mockAddress = this.getMockAddress(latitude, longitude);
      
      return {
        latitude,
        longitude,
        formattedAddress: mockAddress.formatted,
        city: mockAddress.city,
        province: mockAddress.province,
        postalCode: mockAddress.postalCode,
      };
    } catch (error) {
      this.logger.error('Reverse geocoding failed', error);
      throw new BadRequestException('Unable to reverse geocode coordinates');
    }
  }

  private getMockCoordinates(city: string): { lat: number; lng: number } {
    const coordinates = {
      'Cape Town': { lat: -33.9249, lng: 18.4241 },
      'Johannesburg': { lat: -26.2041, lng: 28.0473 },
      'Durban': { lat: -29.8587, lng: 31.0218 },
      'Pretoria': { lat: -25.7479, lng: 28.2293 },
      'Port Elizabeth': { lat: -33.9608, lng: 25.6022 },
      'Bloemfontein': { lat: -29.0852, lng: 26.1596 },
      'East London': { lat: -33.0153, lng: 27.9116 },
      'Pietermaritzburg': { lat: -29.6001, lng: 30.3794 },
      'Nelspruit': { lat: -25.4753, lng: 30.9775 },
      'Kimberley': { lat: -28.7282, lng: 24.7499 },
    };

    return coordinates[city] || coordinates['Cape Town'];
  }

  private getMockAddress(lat: number, lng: number): {
    formatted: string;
    city: string;
    province: string;
    postalCode: string;
  } {
    // Simple mock based on approximate coordinates
    if (lat > -30 && lng > 28) {
      return {
        formatted: 'Johannesburg, Gauteng, South Africa',
        city: 'Johannesburg',
        province: 'Gauteng',
        postalCode: '2000',
      };
    } else if (lat < -33 && lng < 20) {
      return {
        formatted: 'Cape Town, Western Cape, South Africa',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8000',
      };
    } else if (lat < -29 && lng > 30) {
      return {
        formatted: 'Durban, KwaZulu-Natal, South Africa',
        city: 'Durban',
        province: 'KwaZulu-Natal',
        postalCode: '4000',
      };
    }

    return {
      formatted: 'Cape Town, Western Cape, South Africa',
      city: 'Cape Town',
      province: 'Western Cape',
      postalCode: '8000',
    };
  }
}

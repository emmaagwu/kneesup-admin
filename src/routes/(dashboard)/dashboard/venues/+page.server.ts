import type { PageServerLoad, Actions } from './$types';
import { getAllVenues, createVenue } from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import { storage } from '$lib/firebase/server';

export const load: PageServerLoad = async () => {
  const venues = await getAllVenues();
  return { venues };
};

export const actions: Actions = {
  createVenue: async ({ request }) => {
    const formData = await request.formData();
    
    const venueName = formData.get('venueName') as string;
    const venueDescription = formData.get('venueDescription') as string;
    const venueOrg = formData.get('venueOrg') as string;
    const venueAddress = formData.get('venueAddress') as string;
    const venueCity = formData.get('venueCity') as string;
    const venueState = formData.get('venueState') as string;
    const venueCountry = formData.get('venueCountry') as string;
    const venueZip = formData.get('venueZip') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const email = formData.get('email') as string;
    const venuePhoto = formData.get('photo') as File | null;

    // Validation
    if (!venueName || !venueName.trim()) {
      return fail(400, { error: 'Venue name is required' });
    }

    if (!venueOrg || !venueOrg.trim()) {
      return fail(400, { error: 'Organization is required' });
    }

    if (!venueAddress || !venueAddress.trim()) {
      return fail(400, { error: 'Address is required' });
    }

    if (!venueCity || !venueCity.trim()) {
      return fail(400, { error: 'City is required' });
    }

    if (!venueState || !venueState.trim()) {
      return fail(400, { error: 'State is required' });
    }

    if (!venueCountry || !venueCountry.trim()) {
      return fail(400, { error: 'Country is required' });
    }

    try {
      let imageURL: string | undefined;

      // Handle photo upload if provided
      if (venuePhoto && venuePhoto.size > 0) {
        const buffer = await venuePhoto.arrayBuffer();
        const timestamp = Date.now();
        const fileName = `venue-image-${timestamp}-${venuePhoto.name}`;
        
        // Upload to Firebase Storage
        const bucket = storage.bucket();
        const file = bucket.file(`venues/${fileName}`);
        
        await file.save(Buffer.from(buffer), {
          metadata: {
            contentType: venuePhoto.type
          }
        });

        // Make file public and get URL
        await file.makePublic();
        imageURL = file.publicUrl();
      }

      // Create venue in Firestore
      const venueId = await createVenue({
        name: venueName.trim(),
        description: venueDescription?.trim() || undefined,
        orgId: venueOrg,
        address: venueAddress.trim(),
        city: venueCity.trim(),
        state: venueState.trim(),
        country: venueCountry.trim(),
        postalCode: venueZip?.trim() || undefined,
        phoneNumber: phoneNumber?.trim() || undefined,
        email: email?.trim() || undefined,
        imageURL
      });

      return {
        success: true,
        venueId,
        message: 'Venue created successfully'
      };
    } catch (error) {
      console.error('Error creating venue:', error);
      return fail(500, {
        error: 'Failed to create venue. Please try again.'
      });
    }
  }
};

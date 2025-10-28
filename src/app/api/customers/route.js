import { NextResponse } from 'next/server';
import { commonQueries } from '@/app/utils/database';

// Input validation schemas
const customerSchema = {
  required: ['customer_code', 'customer_name'],
  optional: ['address', 'contact_number', 'email', 'vat_no', 'svat_no', 'other']
};

function validateCustomerData(data, requireId = false) {
  const errors = [];
  
  if (requireId && !data.id) {
    errors.push('ID is required');
  }
  
  customerSchema.required.forEach(field => {
    if (!data[field] || data[field].toString().trim() === '') {
      errors.push(`${field.replace('_', ' ')} is required`);
    }
  });

  return errors;
}

export async function POST(request) {
  const startTime = performance.now();
  
  try {
    const customerData = await request.json();
    
    // Validate input
    const errors = validateCustomerData(customerData);
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: errors.join(', ') },
        { status: 400 }
      );
    }

    // Sanitize data
    const sanitizedData = {
      customer_code: customerData.customer_code.trim(),
      customer_name: customerData.customer_name.trim(),
      address: customerData.address?.trim() || '',
      contact_number: customerData.contact_number?.trim() || '',
      email: customerData.email?.trim() || '',
      vat_no: customerData.vat_no?.trim() || '',
      svat_no: customerData.svat_no?.trim() || '',
      other: customerData.other?.trim() || ''
    };

    await commonQueries.customers.create(sanitizedData);
    
    const endTime = performance.now();
    
    return NextResponse.json(
      { 
        success: true,
        performance: { responseTime: Math.round(endTime - startTime) }
      },
      { 
        status: 201,
        headers: {
          'Cache-Control': 'no-cache',
          'X-Response-Time': `${Math.round(endTime - startTime)}ms`
        }
      }
    );
  } catch (error) {
    console.error('Customer creation error:', error);
    
    // Handle duplicate entry error
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { success: false, error: 'Customer code already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const startTime = performance.now();
  
  try {
    const customers = await commonQueries.customers.getAll();
    const endTime = performance.now();
    
    return NextResponse.json(
      { 
        success: true, 
        customers,
        count: customers.length,
        performance: { responseTime: Math.round(endTime - startTime) }
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
          'X-Response-Time': `${Math.round(endTime - startTime)}ms`,
          'X-Record-Count': customers.length.toString()
        }
      }
    );
  } catch (error) {
    console.error('Customer fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const startTime = performance.now();
  
  try {
    const customerData = await request.json();
    
    // Validate input
    const errors = validateCustomerData(customerData, true);
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: errors.join(', ') },
        { status: 400 }
      );
    }

    const { id, ...updateData } = customerData;
    
    // Sanitize data
    const sanitizedData = {
      customer_code: updateData.customer_code.trim(),
      customer_name: updateData.customer_name.trim(),
      address: updateData.address?.trim() || '',
      contact_number: updateData.contact_number?.trim() || '',
      email: updateData.email?.trim() || '',
      vat_no: updateData.vat_no?.trim() || '',
      svat_no: updateData.svat_no?.trim() || '',
      other: updateData.other?.trim() || ''
    };

    const result = await commonQueries.customers.update(id, sanitizedData);
    
    // Check if customer was found and updated
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    const endTime = performance.now();
    
    return NextResponse.json(
      { 
        success: true,
        performance: { responseTime: Math.round(endTime - startTime) }
      },
      {
        headers: {
          'Cache-Control': 'no-cache',
          'X-Response-Time': `${Math.round(endTime - startTime)}ms`
        }
      }
    );
  } catch (error) {
    console.error('Customer update error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { success: false, error: 'Customer code already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  const startTime = performance.now();
  
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const result = await commonQueries.customers.delete(id);
    
    // Check if customer was found and deleted
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    const endTime = performance.now();
    
    return NextResponse.json(
      { 
        success: true,
        performance: { responseTime: Math.round(endTime - startTime) }
      },
      {
        headers: {
          'Cache-Control': 'no-cache',
          'X-Response-Time': `${Math.round(endTime - startTime)}ms`
        }
      }
    );
  } catch (error) {
    console.error('Customer deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
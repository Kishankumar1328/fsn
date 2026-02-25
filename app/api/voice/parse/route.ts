import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { VoiceTranscriptionSchema } from '@/lib/schemas';

// Common expense categories
const EXPENSE_CATEGORIES = [
  'food',
  'groceries',
  'transportation',
  'utilities',
  'entertainment',
  'health',
  'clothing',
  'housing',
  'education',
  'shopping',
  'dining',
  'restaurant',
  'coffee',
  'gas',
  'parking',
  'subscriptions',
  'other',
];

function parseExpenseFromText(text: string): {
  category: string;
  amount: number;
  description: string;
  type: 'expense' | 'income';
  mood?: string;
  isDonation?: boolean;
} {
  const lowerText = text.toLowerCase();

  // Detect type (expense vs income)
  const incomeKeywords = ['earned', 'received', 'income', 'paid', 'bonus', 'salary', 'profit'];
  const isIncome = incomeKeywords.some((keyword) => lowerText.includes(keyword));
  const type = isIncome ? 'income' : 'expense';

  // Extract amount using regex (make currency part optional)
  const amountMatch = text.match(/\$?(\d+(?:\.\d{1,2})?)(?:\s*(?:dollars?|bucks|USD))?/i);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

  // Extract category by matching keywords
  let category = 'other';
  for (const cat of EXPENSE_CATEGORIES) {
    if (lowerText.includes(cat)) {
      category = cat;
      break;
    }
  }

  // Extract mood keywords
  const moods = ['stressed', 'happy', 'bored', 'sad', 'excited', 'neutral'];
  let mood = 'neutral';
  for (const m of moods) {
    if (lowerText.includes(m)) {
      mood = m;
      break;
    }
  }

  // Detect donation
  const donationKeywords = ['donated', 'charity', 'gift', 'donation', 'contribution'];
  const isDonation = donationKeywords.some(k => lowerText.includes(k));

  // Extract description (remove amount, category, and mood words)
  let description = text
    .replace(/\$?(\d+(?:\.\d{1,2})?)\s*(?:dollars?|bucks|USD)?/i, '')
    .replace(new RegExp(`\\b${category}\\b`, 'i'), '')
    .replace(new RegExp(`\\b${mood}\\b`, 'i'), '')
    .replace(/(spent|earned|paid|logged|recorded|bought|donated|charity)/gi, '')
    .trim();

  if (!description) {
    description = category.charAt(0).toUpperCase() + category.slice(1);
  }

  return {
    category: isDonation ? 'Donations' : category,
    amount,
    description: description.substring(0, 100),
    type,
    mood,
    isDonation,
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = VoiceTranscriptionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { text } = validation.data;

    // Parse the text to extract expense details
    const parsed = parseExpenseFromText(text);

    if (parsed.amount === 0) {
      return NextResponse.json(
        { success: false, error: 'Could not extract amount from speech. Please try again.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (error) {
    console.error('[v0] Voice parse error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

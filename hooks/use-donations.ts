import useSWR from 'swr';

const fetcher = (url: string) =>
    fetch(url, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
    }).then((res) => res.json());

export function useDonations() {
    const { data, error, mutate } = useSWR('/api/donations', fetcher);

    const createDonation = async (donation: {
        organization: string;
        amount: number;
        cause: string;
        date: number;
        impact_description?: string;
    }) => {
        const response = await fetch('/api/donations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            },
            body: JSON.stringify(donation),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create donation');
        }

        const result = await response.json();
        mutate();
        return result.data;
    };

    return {
        donations: data?.data || [],
        isLoading: !error && !data,
        isError: error,
        createDonation,
        mutate,
    };
}

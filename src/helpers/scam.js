export const checkMemoForScam = memo => {
    const _memo = memo.toLowerCase()
    return (
        _memo.includes('airdrop') ||
        _memo.includes('announcing') ||
        _memo.includes('warning') ||
        _memo.includes('delegate') ||
        _memo.includes('important') ||
        _memo.includes('mina-foundation.org') ||
        _memo.includes('clorio')
    )
}

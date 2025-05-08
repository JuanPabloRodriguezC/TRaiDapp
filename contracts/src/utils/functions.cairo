pub fn abs_diff(a: u128, b: u128) -> u128 {
    if a > b {
        return a - b;
    } else {
        return b - a;
    }
}
import {useState} from 'react';

type ReturnProps = [
    loading: boolean,
    callBack: (...params: any[]) => any,
    result: any
];

function UseLoader<T>(
    callBack: CallableFunction
): ReturnProps {
    const [result, setResult] = useState<unknown>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const callBackWrapper = async (...args: any[]) => {
        try {
            setLoading(true)
            let result = await callBack(...args)
            setResult(result)
        } finally {
            setLoading(false)
        }
    }
    return [loading, callBackWrapper, result];
}

export default UseLoader;

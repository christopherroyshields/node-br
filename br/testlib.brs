! library for testing
def library fntest(&arg1$,&arg3,mat strarr$,mat numarr)
    let arg1$="return1"
    let arg3=54321

    mat strarr$(3)
    let strarr$(1)="yy"
    let strarr$(2)="zz"
    let strarr$(3)="25"
    
    let numarr(1)=1234
    fntest=29
fnend

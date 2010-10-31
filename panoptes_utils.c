#include "panoptes.h"
#include <sys/ioctl.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/stat.h>

void set_pidfile(char *pid_file_name)
{
   int  pid, fd;
   char pidbuf[16];

   if ((fd = open(pid_file_name, O_RDWR|O_CREAT, S_IRUSR|S_IRGRP|S_IROTH)) >= 0){
     pid = getpid();   
     memset((void *)pidbuf, 0x0, sizeof(pidbuf));
     snprintf(pidbuf, sizeof(pidbuf), "%d\n", pid);
     write(fd, pidbuf, strlen(pidbuf));
     close(fd);
   } else {
     fprintf(stderr, "Couldn't open %s, aborting.\n", pid_file_name);
     exit(-1);
   }
}

/* function to become daemon */
void disconnect_from_tty()
{
  int tt;
  
  if ((tt = open("/dev/tty", 2)) >= 0) {
    ioctl(tt, TIOCNOTTY, (char *)0);
    close(tt);
  }
  close(0);
  close(1);
  close(2);
}
